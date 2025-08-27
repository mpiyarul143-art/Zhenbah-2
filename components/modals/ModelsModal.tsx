'use client';
import { useEffect, useState } from 'react';
import { X, Star, StarOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; // Import framer-motion
import type { AiModel } from '@/lib/types';
import type { CustomModel } from '@/lib/customModels'; // Import CustomModel type
import { MODEL_CATALOG } from '@/lib/models';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { mergeModels } from '@/lib/customModels';

export type ModelsModalProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  selectedModels: AiModel[];
  customModels: AiModel[];
  onToggle: (id: string) => void;
};

export default function ModelsModal({
  open,
  onClose,
  selectedIds,
  selectedModels,
  customModels,
  onToggle,
}: ModelsModalProps) {
  const [activeProvider, setActiveProvider] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useLocalStorage<string[]>('ai-fiesta:favorite-models', [
    'unstable-gpt-5-chat',
    'unstable-claude-sonnet-4',
    'gemini-2.5-pro',
    'unstable-grok-4',
    'open-evil',
  ]);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
      return () => {
        document.body.classList.remove('modal-open');
      };
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [open]);

  const buckets: Record<string, AiModel[]> = {
    Favorites: [],
    'Text Models': [],
    'Image Models': [],
    'Audio Models': [],
    Uncensored: [],
    Free: [],
    Good: [],
    Others: [],
  };
  const seen = new Set<string>();
  const isFree = (m: AiModel) => {
    // Only Open Provider models are truly free
    return m.provider === 'open-provider' && m.free;
  };
  const isByok = (m: AiModel) => {
    // OpenRouter, Gemini, Mistral, and Ollama models require configuration (BYOK)
    return m.provider === 'openrouter' || m.provider === 'gemini' || m.provider === 'mistral' || m.provider === 'ollama';
  };
  const isUnc = (m: AiModel) =>
    /uncensored/i.test(m.label) ||
    /venice/i.test(m.model) ||
    m.model === 'evil' ||
    m.model === 'unity';
  const isFav = (m: AiModel) => favoriteIds.includes(m.id);

  // Brand classifier for text models
  const getBrand = (
    m: AiModel,
  ): 'OpenAI' | 'Google' | 'Anthropic' | 'Grok' | 'Open Source Models' => {
    const id = m.id.toLowerCase();
    const model = m.model.toLowerCase();
    const label = m.label.toLowerCase();
    // OpenAI family: gpt-*, o3*, o4*, any explicit openai
    if (
      model.startsWith('gpt-') ||
      model.startsWith('o3') ||
      model.startsWith('o4') ||
      model.includes('openai') ||
      /gpt\b/.test(label)
    )
      return 'OpenAI';
    // Google family: gemini*, gemma*
    if (model.includes('gemini') || model.includes('gemma') || id.includes('gemini'))
      return 'Google';
    // Anthropic family: claude*
    if (model.includes('claude') || id.includes('claude')) return 'Anthropic';
    // Grok family
    if (model.includes('grok') || id.includes('grok')) return 'Grok';
    // Everything else
    return 'Open Source Models';
  };

  // External SVG icons for brand headings (monochrome, reliable)
  // Using Simple Icons CDN
  const BRAND_ICONS: Record<string, { url: string; alt: string }> = {
    OpenAI: { url: 'https://cdn.simpleicons.org/openai/ffffff', alt: 'OpenAI' },
    Google: { url: 'https://cdn.simpleicons.org/google/ffffff', alt: 'Google' },
    Anthropic: { url: 'https://cdn.simpleicons.org/anthropic/ffffff', alt: 'Anthropic' },
    // Grok icon not separate in Simple Icons; using xAI brand
    Grok: { url: 'https://cdn.simpleicons.org/xai/ffffff', alt: 'xAI Grok' },
  };

  const toggleFavorite = (modelId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId],
    );
  };
  const pick = (m: AiModel) => {
    if (isFav(m)) return 'Favorites';
    if (m.category === 'image') return 'Image Models';
    if (m.category === 'audio') return 'Audio Models';
    if (m.category === 'text' || m.provider === 'open-provider') return 'Text Models';
    if (isUnc(m)) return 'Uncensored';
    if (isFree(m)) return 'Free';
    if (m.good) return 'Good';
    return 'Others';
  };

  // Filter models by provider if a specific provider is selected
  const filteredModels =
    activeProvider === 'all'
      ? MODEL_CATALOG
      : activeProvider === 'pro'
        ? MODEL_CATALOG.filter((m) => m.provider === 'unstable' || m.provider === 'mistral')
        : MODEL_CATALOG.filter((m) => m.provider === activeProvider);

  filteredModels.forEach((m) => {
    const key = pick(m as AiModel);
    if (!seen.has(m.id)) {
      buckets[key].push(m as AiModel);
      seen.add(m.id);
    }
  });

  const Section = ({
    title,
    models,
    showBadges = true,
    iconUrl,
    iconAlt,
  }: {
    title: string;
    models: AiModel[];
    showBadges?: boolean;
    iconUrl?: string;
    iconAlt?: string;
  }) => (
    <div className="space-y-2">
      <div className="text-sm md:text-base font-semibold uppercase tracking-wide text-zinc-200 flex items-center gap-2">
        {iconUrl && (
          <img
            src={iconUrl}
            alt={iconAlt || title}
            className="h-4 w-4 object-contain opacity-90"
            data-ignore-errors="true"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {models.map((m) => {
          const free = isFree(m);
          const byok = isByok(m);
          const unc = isUnc(m);
          const selected = selectedIds.includes(m.id);
          const disabled = !selected && selectedModels.length >= 5;
          return (
            <div
              key={m.id}
              className={`model-chip flex items-center justify-between gap-2 w-full h-10 sm:h-9 md:h-9 px-3 sm:px-3 md:px-3 text-xs sm:text-[11px] md:text-sm rounded-lg ${
                disabled ? 'opacity-60 cursor-not-allowed text-zinc-500' : ''
              } ${
                selected
                  ? m.good
                    ? 'model-chip-pro'
                    : free
                      ? 'model-chip-free'
                      : byok
                        ? 'border-blue-400/30 bg-blue-500/10'
                        : 'border-white/20 bg-white/10'
                  : m.good
                    ? 'model-chip-pro'
                    : free
                      ? 'model-chip-free'
                      : byok
                        ? 'border-blue-400/20 bg-blue-500/5 hover:bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              data-selected={selected || undefined}
              data-type={m.good ? 'pro' : free ? 'free' : byok ? 'byok' : unc ? 'unc' : 'other'}
            >
              {/* Model content - clickable area for selection */}
              <button
                onClick={() => !disabled && onToggle(m.id)}
                className="flex-1 flex items-center gap-1.5 min-w-0 text-left h-full"
                disabled={disabled}
                title={
                  selected ? 'Click to unselect' : disabled ? 'Limit reached' : 'Click to select'
                }
              >
                {showBadges && m.good && (
                  <span className="badge-base badge-pro inline-flex items-center gap-1 px-1.5 py-0.5">
                    <Star size={12} className="shrink-0" />
                    <span className="hidden sm:inline">Pro</span>
                  </span>
                )}
                {showBadges && free && (
                  <span className="badge-base badge-free inline-flex items-center gap-1 px-1.5 py-0.5">
                    <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                    <span className="hidden sm:inline">Free</span>
                  </span>
                )}
                {showBadges && byok && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 ring-1 ring-blue-300/30">
                    <span className="h-2 w-2 rounded-full bg-blue-200" />
                    <span className="hidden sm:inline">BYOK</span>
                  </span>
                )}
                {showBadges && unc && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-200 ring-1 ring-rose-300/30">
                    <span className="h-2 w-2 rounded-full bg-rose-200" />
                    <span className="hidden sm:inline">Uncensored</span>
                  </span>
                )}
                {showBadges && m.category === 'image' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 ring-1 ring-purple-300/30">
                    <span className="h-2 w-2 rounded-full bg-purple-200" />
                    <span className="hidden sm:inline">Image</span>
                  </span>
                )}
                {showBadges && m.category === 'audio' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-200 ring-1 ring-orange-300/30">
                    <span className="h-2 w-2 rounded-full bg-orange-200" />
                    <span className="hidden sm:inline">Audio</span>
                  </span>
                )}
                <span className="truncate max-w-full">{m.label}</span>
              </button>

              {/* Action buttons - separate from selection */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Favorite toggle button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(m.id);
                  }}
                  className={`p-1 rounded-md transition-colors ${
                    isFav(m)
                      ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20'
                      : 'text-zinc-400 hover:text-zinc-300 hover:bg-white/10'
                  }`}
                  title={isFav(m) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFav(m) ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
                </button>

                {/* Model selection toggle */}
                <button
                  onClick={() => !disabled && onToggle(m.id)}
                  className="model-toggle-pill"
                  data-type={m.good ? 'pro' : free ? 'free' : byok ? 'byok' : 'other'}
                  data-active={selected || undefined}
                  disabled={disabled}
                  title={
                    selected ? 'Click to unselect' : disabled ? 'Limit reached' : 'Click to select'
                  }
                >
                  <span className="model-toggle-thumb" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const order: Array<keyof typeof buckets> = [
    'Favorites',
    'Text Models',
    'Image Models',
    'Audio Models',
    'Uncensored',
    'Free',
    'Good',
    'Others',
  ];
  // Build sections; for Text Models, group into branded subsections
  const builtInSections = order
    .filter((k) => buckets[k].length > 0)
    .flatMap((k) => {
      if (k !== 'Text Models') return <Section key={k} title={k} models={buckets[k]} />;
      const textModels = buckets[k].filter(
        (m) => m.category === 'text' || m.provider === 'open-provider',
      );
      const grouped: Record<string, AiModel[]> = {
        OpenAI: [],
        Google: [],
        Anthropic: [],
        Grok: [],
        'Open Source Models': [],
      };
      textModels.forEach((m) => {
        grouped[getBrand(m)].push(m);
      });
      const brandOrder = ['OpenAI', 'Google', 'Anthropic', 'Grok', 'Open Source Models'] as const;
      return brandOrder
        .filter((name) => grouped[name].length > 0)
        .map((name) => (
          <Section
            key={`Text-${name}`}
            title={name}
            models={grouped[name]}
            iconUrl={BRAND_ICONS[name]?.url}
            iconAlt={BRAND_ICONS[name]?.alt}
          />
        ));
    });

  const customSection = (
    <Section key="Custom models" title="Custom models" models={customModels} showBadges={false} />
  );

  // Use merged models for tab counts
  // Type assertion: we know customModels contains only CustomModel instances
  const allModels = mergeModels(customModels as CustomModel[]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full sm:w-full max-w-none sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-3 sm:mx-auto rounded-xl sm:rounded-2xl border border-white/10 bg-zinc-900/90 p-4 sm:p-6 md:p-7 lg:p-8 shadow-2xl h-[90vh] sm:max-h-[90vh] overflow-hidden flex flex-col min-h-0"
          >
            <div className="px-4 sm:-mx-6 md:-mx-7 lg:-mx-8 sm:px-6 md:px-7 lg:px-8 pt-1 pb-3 mb-3 flex items-center justify-between bg-zinc-900/95 backdrop-blur border-b border-white/10">
              <h3 className="text-base md:text-lg lg:text-xl font-semibold tracking-wide">
                Select up to 5 models
              </h3>
              <button
                aria-label="Close"
                onClick={onClose}
                className="h-8 w-8 md:h-9 md:w-9 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs md:text-sm text-zinc-300 mb-4">
              Selected: {selectedModels.length}/5
            </div>

            {/* Provider Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-white/10">
              {[
                { id: 'all', label: 'All Models', count: allModels.length },
                { id: 'pro', label: 'Pro Models', count: allModels.filter(m => m.provider === 'unstable' || m.provider === 'mistral').length },
                { id: 'gemini', label: 'Gemini', count: allModels.filter(m => m.provider === 'gemini').length },
                { id: 'openrouter', label: 'OpenRouter', count: allModels.filter(m => m.provider === 'openrouter').length },
                { id: 'open-provider', label: 'Open Provider', count: allModels.filter(m => m.provider === 'open-provider').length },
                { id: 'unstable', label: 'Unstable', count: allModels.filter(m => m.provider === 'unstable').length },
                { id: 'mistral', label: 'Mistral', count: allModels.filter(m => m.provider === 'mistral').length },
                { id: 'ollama', label: 'Ollama', count: allModels.filter(m => m.provider === 'ollama').length },
              ].map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setActiveProvider(provider.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeProvider === provider.id
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {provider.label} {provider.count}
                </button>
              ))}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1 scroll-touch safe-inset">
              {customSection}
              {builtInSections}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
