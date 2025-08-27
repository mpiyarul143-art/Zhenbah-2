'use client';
import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';

import HeaderBar from '@/components/app/HeaderBar';
import SelectedModelsBar from '@/components/chat/SelectedModelsBar';
import VoiceSelector from '@/components/modals/VoiceSelector';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { mergeModels, useCustomModels } from '@/lib/customModels';
import { ChatMessage, ApiKeys, ChatThread, AiModel } from '@/lib/types';
import { createChatActions } from '@/lib/chatActions';
import { useProjects } from '@/lib/useProjects';
import FixedInputBar from '@/components/chat/FixedInputBar';
import ThreadSidebar from '@/components/chat/ThreadSidebar';
import ChatGrid from '@/components/chat/ChatGrid';
import { useTheme } from '@/lib/themeContext';
import { BACKGROUND_STYLES } from '@/lib/themes';
import { safeUUID } from '@/lib/uuid';
import LaunchScreen from '@/components/ui/LaunchScreen';

// Lazy loaded components
const LazyModelsModal = lazy(() => import('@/components/modals/ModelsModal'));
const LazyFirstVisitNote = lazy(() => import('@/components/app/FirstVisitNote'));

export default function Home() {
  const { theme } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const backgroundClass = BACKGROUND_STYLES[theme.background].className;

  const [selectedIds, setSelectedIds] = useLocalStorage<string[]>('ai-fiesta:selected-models', [
    'open-gpt-5-nano', // GPT-5 Nano
    'open-midijourney', // Midjourney
    'open-evil',
    'open-mistral', // Mistral Small 3.1
    'open-llamascout', // Llama Scout
  ]);
  const [keys] = useLocalStorage<ApiKeys>('ai-fiesta:keys', {});
  const [threads, setThreads] = useLocalStorage<ChatThread[]>('ai-fiesta:threads', []);
  const [activeId, setActiveId] = useLocalStorage<string | null>('ai-fiesta:active-thread', null);
  const [sidebarOpen, setSidebarOpen] = useLocalStorage<boolean>('ai-fiesta:sidebar-open', true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modelsModalOpen, setModelsModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useLocalStorage<string>(
    'ai-fiesta:selected-voice',
    'alloy',
  );

  const [customModels] = useCustomModels();
  const allModels = useMemo(() => mergeModels(customModels), [customModels]);

  // Projects hook from main
  const {
    projects,
    activeProjectId,
    activeProject,
    createProject,
    updateProject,
    deleteProject,
    selectProject,
  } = useProjects();

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId],
  );
  // Only show chats for the active project (or all if none selected)
  const visibleThreads = useMemo(
    () => (activeProjectId ? threads.filter((t) => t.projectId === activeProjectId) : threads),
    [threads, activeProjectId],
  );
  const messages = useMemo(() => activeThread?.messages ?? [], [activeThread]);

  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  // Allow collapsing a model column without unselecting it
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const selectedModels = useMemo(
    () => selectedIds.map((id) => allModels.find((m) => m.id === id)).filter(Boolean) as AiModel[],
    [selectedIds, allModels],
  );
  // Build grid template: collapsed => fixed narrow, expanded => normal
  const headerTemplate = useMemo(() => {
    if (selectedModels.length === 0) return '';
    const parts = selectedModels.map((m) =>
      collapsedIds.includes(m.id) ? '72px' : 'minmax(280px, 1fr)',
    );
    return parts.join(' ');
  }, [selectedModels, collapsedIds]);

  const anyLoading = loadingIds.length > 0;

  const [firstNoteDismissed, setFirstNoteDismissed] = useLocalStorage<boolean>(
    'ai-fiesta:first-visit-note-dismissed',
    false,
  );
  const showFirstVisitNote =
    isHydrated && !firstNoteDismissed && (!keys?.openrouter || !keys?.gemini);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      const valid = new Set(allModels.map((m) => m.id));
      const currentValidCount = prev.filter((x) => valid.has(x)).length;
      if (currentValidCount >= 5) return prev;
      return [...prev, id];
    });
  };

  // Chat actions (send and onEditUser) moved to lib/chatActions.ts to avoid state races
  const { send, onEditUser } = useMemo(
    () =>
      createChatActions({
        selectedModels,
        keys,
        threads,
        activeThread,
        setThreads,
        setActiveId,
        setLoadingIds: (updater) => setLoadingIds(updater),
        setLoadingIdsInit: (ids) => setLoadingIds(ids),
        activeProject, // include project system prompt/context
        selectedVoice, // pass voice selection for audio models
      }),
    [
      selectedModels,
      keys,
      threads,
      activeThread,
      setThreads,
      setActiveId,
      activeProject,
      selectedVoice,
    ],
  );

  // group assistant messages by turn for simple compare view
  const pairs = useMemo(() => {
    const rows: { user: ChatMessage; answers: ChatMessage[] }[] = [];
    let currentUser: ChatMessage | null = null;
    for (const m of messages) {
      if (m.role === 'user') {
        currentUser = m;
        rows.push({ user: m, answers: [] });
      } else if (m.role === 'assistant' && currentUser) {
        rows[rows.length - 1]?.answers.push(m);
      }
    }
    return rows;
  }, [messages]);

  // Delete a full user turn (user + all its answers)
  const onDeleteUser = (turnIndex: number) => {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        const msgs = t.messages;
        const userStarts: number[] = [];
        for (let i = 0; i < msgs.length; i++) if (msgs[i].role === 'user') userStarts.push(i);
        const start = userStarts[turnIndex];
        if (start === undefined) return t;
        const end = userStarts[turnIndex + 1] ?? msgs.length; // exclusive
        const nextMsgs = msgs.filter((_, idx) => idx < start || idx >= end);
        return { ...t, messages: nextMsgs };
      }),
    );
  };

  // Delete a specific model's answer within a turn
  const onDeleteAnswer = (turnIndex: number, modelId: string) => {
    if (!activeThread) return;
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThread.id) return t;
        const msgs = t.messages;
        const userStarts: number[] = [];
        for (let i = 0; i < msgs.length; i++) if (msgs[i].role === 'user') userStarts.push(i);
        const start = userStarts[turnIndex];
        if (start === undefined) return t;
        const end = userStarts[turnIndex + 1] ?? msgs.length; // exclusive
        let removed = false;
        const nextMsgs = msgs.filter((m, idx) => {
          if (idx <= start || idx >= end) return true;
          if (!removed && m.role === 'assistant' && m.modelId === modelId) {
            removed = true;
            return false;
          }
          return true;
        });
        return { ...t, messages: nextMsgs };
      }),
    );
  };

  useEffect(() => {
    setIsHydrated(true);
    const t = setTimeout(() => setShowSplash(false), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`min-h-screen w-full ${backgroundClass} relative text-black dark:text-white`}>
      {showSplash && (
        <div className="fixed inset-0 z-[9999]">
          <LaunchScreen backgroundClass={backgroundClass} dismissed={isHydrated} />
        </div>
      )}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-95" />

      <div className="relative z-10 px-3 lg:px-4 py-4 lg:py-6">
        <div className="flex gap-3 lg:gap-4">
          {/* Sidebar */}
          <ThreadSidebar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            threads={visibleThreads}
            activeId={activeId}
            onSelectThread={(id) => setActiveId(id)}
            onNewChat={() => {
              const t: ChatThread = {
                id: safeUUID(),
                title: 'New Chat',
                messages: [],
                createdAt: Date.now(),
                projectId: activeProjectId || undefined,
              };
              setThreads((prev) => [t, ...prev]);
              setActiveId(t.id);
            }}
            mobileSidebarOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
            onOpenMobile={() => setMobileSidebarOpen(true)}
            onDeleteThread={(id) => {
              setThreads((prev) => {
                const next = prev.filter((t) => t.id !== id);
                if (activeId === id) {
                  const nextInScope =
                    (activeProjectId ? next.find((t) => t.projectId === activeProjectId) : next[0])
                      ?.id ?? null;
                  setActiveId(nextInScope);
                }
                return next;
              });
            }}
            selectedModels={selectedModels}
            // Projects (from main)
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={selectProject}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] overflow-hidden ">
            {/* Top bar */}
            <HeaderBar
              onOpenMenu={() => setMobileSidebarOpen(true)}
              title="Open Fiesta"
              githubOwner="NiladriHazra"
              githubRepo="Open-Fiesta"
              onOpenModelsModal={() => setModelsModalOpen(true)}
              className="-mr-3 sm:mr-0"
            />

            {/* Selected models row + actions */}
            <SelectedModelsBar selectedModels={selectedModels} onToggle={toggle} />

            {/* Voice selector for audio models */}
            {isHydrated && selectedModels.some((m) => m.category === 'audio') && (
              <div className="mb-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Voice:</span>
                  <VoiceSelector selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice} />
                </div>
              </div>
            )}

            <Suspense fallback={null}>
              <LazyModelsModal
                open={modelsModalOpen}
                onClose={() => setModelsModalOpen(false)}
                selectedIds={selectedIds}
                selectedModels={selectedModels}
                customModels={customModels}
                onToggle={toggle}
              />
            </Suspense>

            {isHydrated && (
              <Suspense fallback={null}>
                <LazyFirstVisitNote
                  open={showFirstVisitNote}
                  onClose={() => setFirstNoteDismissed(true)}
                />
              </Suspense>
            )}

            {isHydrated && (
              <ChatGrid
                selectedModels={selectedModels}
                headerTemplate={headerTemplate}
                collapsedIds={collapsedIds}
                setCollapsedIds={setCollapsedIds}
                loadingIds={loadingIds}
                pairs={pairs}
                onEditUser={onEditUser}
                onDeleteUser={onDeleteUser}
                onDeleteAnswer={onDeleteAnswer}
              />
            )}

            {isHydrated && <FixedInputBar onSubmit={send} loading={anyLoading} />}
          </div>
        </div>
      </div>
    </div>
  );
}
