'use client';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import type { AiModel, ChatMessage } from '@/lib/types';
import { ChevronDown, ChevronUp, Eye, Loader2, Pencil, Star, Trash } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion'; // Import framer-motion
import MarkdownLite from './MarkdownLite';
import { CopyToClipboard } from '../ui/CopyToClipboard';
import { estimateTokens, sanitizeContent } from '@/lib/utils';

export type ChatGridProps = {
  selectedModels: AiModel[];
  headerTemplate: string;
  collapsedIds: string[];
  setCollapsedIds: (updater: (prev: string[]) => string[]) => void;
  loadingIds: string[];
  pairs: { user: ChatMessage; answers: ChatMessage[] }[];
  onEditUser: (turnIndex: number, newText: string) => void;
  onDeleteUser: (turnIndex: number) => void;
  onDeleteAnswer: (turnIndex: number, modelId: string) => void;
};

export default function ChatGrid({
  selectedModels,
  headerTemplate,
  collapsedIds,
  setCollapsedIds,
  loadingIds,
  pairs,
  onEditUser,
  onDeleteUser,
  onDeleteAnswer,
}: ChatGridProps) {
  const [pendingDelete, setPendingDelete] = useState<
    | { type: 'turn'; turnIndex: number }
    | { type: 'answer'; turnIndex: number; modelId: string }
    | null
  >(null);
  const headerCols = useMemo(
    () => headerTemplate || `repeat(${selectedModels.length}, minmax(260px, 1fr))`,
    [headerTemplate, selectedModels.length],
  );
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth', // change to "auto" if you want instant jump
      });
    }
  }, [pairs]);

  return (
    <>
      <div
        ref={scrollRef}
        className="relative rounded-lg border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 px-3 lg:px-4 pt-2 overflow-x-auto flex-1 overflow-y-auto pb-28 sm:scroll-stable-gutter"
      >
        {selectedModels.length === 0 ? (
          <div className="p-4 text-zinc-500 dark:text-zinc-400">
            Select up to 5 models to compare.
          </div>
        ) : (
          <div className="min-w-full space-y-3">
            {/* Header row: model labels */}
            <div
              className="grid min-w-full gap-3 items-center overflow-visible mt-0 sticky top-0 left-0 right-0 z-30 -mx-3 px-3 lg:-mx-4 lg:px-4 py-1 rounded-t-lg shadow-[0_1px_0_rgba(0,0,0,0.4)] bg-transparent border-0 sm:bg-black/40 dark:sm:bg-black/40 sm:backdrop-blur-sm sm:border-b sm:border-black/10 dark:sm:border-white/10"
              style={{ gridTemplateColumns: headerCols }}
            >
              {selectedModels.map((m) => {
                const isFree = /(\(|\s)free\)/i.test(m.label);
                const isCollapsed = collapsedIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    className={`px-2.5 py-2 sm:px-2 sm:py-2 min-h-[42px] flex items-center ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } overflow-visible rounded-lg backdrop-blur-sm shadow-[0_1px_8px_rgba(0,0,0,0.25)] ring-1 ${
                      m.good
                        ? 'ring-amber-300/35 bg-gradient-to-b from-amber-500/10 to-black/50'
                        : 'ring-white/10 bg-black/55'
                    } dark:${
                      m.good
                        ? 'ring-amber-300/35 from-amber-400/10 to-black/60'
                        : 'ring-white/10 bg-black/60'
                    }`}
                  >
                    {!isCollapsed && (
                      <div
                        className={`text-[12px] leading-normal font-medium pr-2 inline-flex items-center gap-1.5 min-w-0 drop-shadow-[0_1px_0_rgba(0,0,0,0.35)] sm:drop-shadow-none ${
                          m.good || isFree
                            ? 'opacity-100 text-black dark:text-white'
                            : 'opacity-100 text-black dark:text-white sm:opacity-90'
                        }`}
                      >
                        {m.good && (
                          <span className="badge-base badge-pro inline-flex items-center gap-1 h-6 self-center">
                            <Star size={11} />
                            <span className="hidden sm:inline">Pro</span>
                          </span>
                        )}
                        {isFree && (
                          <span className="badge-base badge-free inline-flex items-center gap-1 h-6 self-center">
                            <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                            <span className="hidden sm:inline">Free</span>
                          </span>
                        )}
                        <span
                          className="truncate max-w-[18ch] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[12px]"
                          title={m.label}
                        >
                          {m.label}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <button
                          onClick={() =>
                            setCollapsedIds((prev) => prev.filter((id) => id !== m.id))
                          }
                          className="icon-btn h-7 w-7 accent-focus"
                          title={`Expand ${m.label}`}
                        >
                          <ChevronDown size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => setCollapsedIds((prev) => [...prev, m.id])}
                          className="icon-btn h-7 w-7 accent-focus"
                          title={`Collapse ${m.label}`}
                        >
                          <ChevronUp size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pairs.map((row, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3"
              >
                {/* Prompt callout */}
                <div className="relative flex items-start justify-between gap-3 px-3 py-2 rounded-lg ring-1 ring-black/10 dark:ring-white/10 chat-prompt-accent">
                  <div className="chat-prompt-side" />
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-semibold text-black dark:text-white bg-black/60 dark:bg-black/60 ring-1 ring-black/15 dark:ring-white/15 border border-black/15 dark:border-white/15 backdrop-blur-sm shadow-[0_2px_10px_rgba(0,0,0,0.45)] shrink-0">
                      <span className="h-2 w-2 rounded-full bg-black/90 dark:bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.6)] dark:shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                      You
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed text-black dark:text-white">
                        {row.user.content}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditUser(i, row.user.content)}
                      className="icon-btn h-7 w-7 accent-focus"
                      title="Edit message"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDeleteUser(i)}
                      className="icon-btn h-7 w-7 accent-focus"
                      title="Delete message"
                    >
                      <Trash size={14} />
                    </button>

                    <CopyToClipboard getText={() => row.user.content} />
                  </div>
                </div>

                <div
                  className="grid gap-3 items-stretch"
                  style={{ gridTemplateColumns: headerCols }}
                >
                  {selectedModels.map((m) => {
                    const ans = row.answers.find((a) => a.modelId === m.id);
                    const isCollapsed = collapsedIds.includes(m.id);
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="h-full"
                      >
                        <div
                          className={`group relative rounded-lg ${
                            isCollapsed ? 'p-2.5' : 'p-3'
                          } h-full min-h-[140px] flex overflow-hidden ring-1 transition-shadow bg-gradient-to-b from-black/40 to-black/20 ring-white/10 backdrop-blur-[2px] ${
                            isCollapsed ? 'cursor-pointer' : 'hover:ring-white/20'
                          }`}
                          onClick={() => {
                            if (isCollapsed)
                              setCollapsedIds((prev) => prev.filter((id) => id !== m.id));
                          }}
                          title={isCollapsed ? 'Click to expand' : undefined}
                        >
                          {/* decorative overlay removed for cleaner look */}
                          {ans && String(ans.content || '').length > 0 && (
                            <div
                              className={`absolute top-2 right-2 z-10 flex gap-2 ${
                                isCollapsed
                                  ? 'opacity-0 pointer-events-none'
                                  : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <button
                                onClick={() =>
                                  setPendingDelete({
                                    type: 'answer',
                                    turnIndex: i,
                                    modelId: m.id,
                                  })
                                }
                                className="icon-btn h-7 w-7 accent-focus"
                                title={`Delete ${m.label} response`}
                              >
                                <Trash size={12} />
                              </button>
                              <CopyToClipboard
                                getText={() => sanitizeContent(ans.content)}
                                title={`Copy ${m.label} response`}
                              />
                            </div>
                          )}
                          <div
                            className={`text-sm leading-relaxed w-full pr-8 ${
                              isCollapsed ? 'overflow-hidden max-h-20 opacity-70' : 'space-y-2'
                            } ${
                              !isCollapsed
                                ? 'max-h-[40vh] md:max-h-[400px] overflow-y-auto custom-scrollbar'
                                : ''
                            }`}
                            style={{ WebkitOverflowScrolling: 'touch' }}
                          >
                            {ans &&
                            String(ans.content || '').length > 0 &&
                            !['Thinking…', 'Typing…'].includes(String(ans.content)) ? (
                              <>
                                <div className="max-w-[72ch]">
                                  <MarkdownLite text={sanitizeContent(ans.content)} />
                                </div>
                                {/* Token usage footer */}
                                {ans.tokens &&
                                  !isCollapsed &&
                                  (() => {
                                    const by = ans.tokens?.by;
                                    const model = ans.tokens?.model;
                                    const inTokens = Array.isArray(ans.tokens?.perMessage)
                                      ? ans.tokens!.perMessage!.reduce(
                                          (sum, x) => sum + (Number(x?.tokens) || 0),
                                          0,
                                        )
                                      : (ans.tokens?.total ?? undefined);
                                    const outTokens = estimateTokens(String(ans.content || ''));
                                    return (
                                      <div className="mt-2 text-[11px] text-zinc-300/80">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-white/10 bg-white/5">
                                          {typeof inTokens === 'number' && (
                                            <span className="opacity-80">In:</span>
                                          )}
                                          {typeof inTokens === 'number' && (
                                            <span className="font-medium">{inTokens}</span>
                                          )}
                                          <span className="opacity-80">Out:</span>
                                          <span className="font-medium">{outTokens}</span>
                                          {by && <span className="opacity-70">• {by}</span>}
                                          {model && <span className="opacity-70">• {model}</span>}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                {ans.code === 503 && ans.provider === 'openrouter' && (
                                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/15 ring-1 ring-amber-300/30 px-2.5 py-1.5 rounded">
                                    <span>
                                      Free pool temporarily unavailable (503). Try again soon,
                                      switch model, or add your own OpenRouter API key for higher
                                      limits.
                                    </span>
                                    <button
                                      onClick={() =>
                                        window.dispatchEvent(new Event('open-settings'))
                                      }
                                      className="ml-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                    >
                                      Add key
                                    </button>
                                  </div>
                                )}
                                {(() => {
                                  try {
                                    const txt = String(ans.content || '');
                                    const show =
                                      /add your own\s+(?:openrouter|gemini)\s+api key/i.test(txt);
                                    return show;
                                  } catch {
                                    return false;
                                  }
                                })() && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() =>
                                        window.dispatchEvent(new Event('open-settings'))
                                      }
                                      className="text-xs px-2.5 py-1 rounded text-white border border-white/10 accent-action-fill"
                                    >
                                      Add keys
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : loadingIds.includes(m.id) ||
                              (ans && ['Thinking…', 'Typing…'].includes(String(ans.content))) ? (
                              <div className="w-full self-stretch space-y-3">
                                <div className="inline-flex items-center gap-2 text-[12px] font-medium text-rose-100">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 ring-1 ring-rose-300/30">
                                    <Loader2 className="animate-spin" size={13} />
                                    Thinking…
                                  </span>
                                </div>
                                <div className="animate-pulse space-y-2">
                                  <div className="h-2.5 w-1/3 rounded accent-bar-faint" />
                                  <div className="h-2 rounded bg-white/10" />
                                  <div className="h-2 rounded bg-white/10 w-5/6" />
                                  <div className="h-2 rounded bg-white/10 w-2/3" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-400 text-sm">No response</span>
                            )}
                          </div>
                          {isCollapsed && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] px-2 py-1 rounded-full border border-white/10 bg-black/50 inline-flex items-center gap-1">
                                <Eye size={12} /> Expand
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.type === 'turn' ? 'Delete this turn?' : 'Delete model answer?'}
        message={
          pendingDelete?.type === 'turn'
            ? 'This will remove your prompt and all model answers for this turn.'
            : "This will remove the selected model's response for this turn."
        }
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === 'turn') {
            onDeleteUser(pendingDelete.turnIndex);
          } else {
            onDeleteAnswer(pendingDelete.turnIndex, pendingDelete.modelId);
          }
          setPendingDelete(null);
        }}
      />
    </>
  );
}
