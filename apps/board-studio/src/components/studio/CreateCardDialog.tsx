// ============================================================
// CreateCardDialog — modal for creating a new card from studio
// Vertical-aware: shows intent type selection and schema fields
// ============================================================

import React, { useState, useMemo } from 'react';
import { X, Wrench, DollarSign, Timer, ClipboardCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge, Button } from '@airaie/ui';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardType, Board, IntentParameter } from '@/types/board';
import { VERTICAL_REGISTRY } from '@/constants/vertical-registry';
import { resolveVerticalSlug } from '@hooks/useVerticalConfig';
import VerticalBadge from '@components/boards/VerticalBadge';

export interface CreateCardDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    type: string;
    description?: string;
    intent_type?: string;
    config?: Record<string, unknown>;
  }) => void;
  isPending?: boolean;
  board?: Board;
}

const CARD_TYPES: { value: CardType; label: string; description: string }[] = [
  { value: 'analysis', label: 'Analysis', description: 'FEA, CFD, thermal analysis' },
  { value: 'comparison', label: 'Comparison', description: 'Compare results across runs' },
  { value: 'sweep', label: 'Parametric Sweep', description: 'Parameter sweeps, DOE' },
  { value: 'agent', label: 'Agent Task', description: 'Automated agent workflow' },
  { value: 'gate', label: 'Gate Card', description: 'Gate validation checkpoint' },
  { value: 'milestone', label: 'Milestone', description: 'Project milestone marker' },
];

const CreateCardDialog: React.FC<CreateCardDialogProps> = ({
  open,
  onClose,
  onSubmit,
  isPending = false,
  board,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<CardType>('analysis');
  const [description, setDescription] = useState('');
  const [intentType, setIntentType] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});

  // Resolve vertical context
  const verticalSlug = useMemo(() => resolveVerticalSlug(board), [board]);
  const verticalEntry = verticalSlug ? VERTICAL_REGISTRY[verticalSlug] : null;

  // Get intent configs for this vertical
  const intentConfigs = useMemo(() => {
    if (!verticalEntry) return [];
    return Object.values(verticalEntry.intentConfigs);
  }, [verticalEntry]);

  // Get the selected intent config
  const selectedIntentConfig = useMemo(() => {
    if (!intentType || !verticalEntry) return null;
    return verticalEntry.intentConfigs[intentType] ?? null;
  }, [intentType, verticalEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: {
      name: string;
      type: string;
      description?: string;
      intent_type?: string;
      config?: Record<string, unknown>;
    } = {
      name: name.trim(),
      type,
      description: description.trim() || undefined,
    };

    if (intentType) {
      payload.intent_type = intentType;
    }

    // Include config values if any were set
    const hasConfig = Object.keys(configValues).some(
      (key) => configValues[key] !== '' && configValues[key] != null
    );
    if (hasConfig) {
      payload.config = configValues;
    }

    onSubmit(payload);

    // Reset form
    setName('');
    setType('analysis');
    setDescription('');
    setIntentType(null);
    setConfigValues({});
  };

  const handleIntentTypeSelect = (slug: string) => {
    if (intentType === slug) {
      setIntentType(null);
      setConfigValues({});
    } else {
      setIntentType(slug);
      setConfigValues({});
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div
              className="bg-white border border-surface-border shadow-xl w-full max-w-lg pointer-events-auto max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-content-primary">New Card</h2>
                  {verticalEntry && <VerticalBadge theme={verticalEntry.theme} />}
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-content-muted hover:text-content-primary transition-colors"
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Card Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. FEA Stress Analysis"
                    className="w-full px-3 py-2 text-sm border border-surface-border bg-white
                      text-content-primary placeholder:text-content-muted
                      focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                    aria-label="Card name"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Card Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CARD_TYPES.map((ct) => (
                      <button
                        key={ct.value}
                        type="button"
                        onClick={() => setType(ct.value)}
                        className={`
                          text-left px-3 py-2 border transition-all text-xs
                          ${type === ct.value
                            ? 'border-blue-500 bg-blue-50 text-content-primary'
                            : 'border-surface-border bg-white text-content-secondary hover:border-content-muted'
                          }
                        `}
                      >
                        <div className="font-medium">{ct.label}</div>
                        <div className="text-[10px] text-content-muted mt-0.5">{ct.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intent Type selection (when vertical is known) */}
                {intentConfigs.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1.5">
                      Intent Type <span className="text-content-muted font-normal">(optional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {intentConfigs.map((ic) => {
                        const isSelected = intentType === ic.intentTypeSlug;
                        const IconComp = ic.icon;
                        return (
                          <button
                            key={ic.intentTypeSlug}
                            type="button"
                            onClick={() => handleIntentTypeSelect(ic.intentTypeSlug)}
                            className={`
                              flex items-center gap-2 text-left px-3 py-2 border transition-all text-xs
                              ${isSelected
                                ? `border-${verticalEntry?.theme.accentColor ?? 'blue-500'} bg-${verticalEntry?.theme.accentBg ?? 'blue-50'} text-content-primary`
                                : 'border-surface-border bg-white text-content-secondary hover:border-content-muted'
                              }
                            `}
                          >
                            <IconComp size={14} className={isSelected ? `text-${verticalEntry?.theme.accentText ?? 'blue-700'}` : 'text-content-muted'} aria-hidden="true" />
                            <span className="font-medium">{ic.displayName}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Execution Preview (when intent has execution hints) */}
                {selectedIntentConfig?.executionHints && (
                  <div className="border border-surface-border bg-slate-50/50 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
                        Execution Preview
                      </span>
                      <Button variant="outline" size="sm" icon={Sparkles} onClick={() => {/* mark for auto-plan */}}>
                        Quick Setup
                      </Button>
                    </div>

                    {/* Recommended tool */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Wrench size={11} className="text-content-muted" />
                      <span className="text-content-secondary">Recommended:</span>
                      <span className="font-medium text-content-primary">
                        {selectedIntentConfig.executionHints.recommendedTools[0]}
                      </span>
                    </div>

                    {/* Cost + Duration */}
                    <div className="flex items-center gap-3 text-[11px] text-content-muted">
                      <span className="flex items-center gap-0.5">
                        <DollarSign size={10} />
                        ${selectedIntentConfig.executionHints.typicalCost.min}–${selectedIntentConfig.executionHints.typicalCost.max}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Timer size={10} />
                        {selectedIntentConfig.executionHints.typicalDuration.min}–{selectedIntentConfig.executionHints.typicalDuration.max}
                      </span>
                    </div>

                    {/* Expected Evidence */}
                    {selectedIntentConfig.evidenceSchema && (
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
                          <ClipboardCheck size={10} />
                          <span>Expected Evidence</span>
                        </div>
                        <div className="space-y-0.5">
                          {selectedIntentConfig.evidenceSchema.expectedMetrics.map((m) => (
                            <div key={m.key} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-content-muted">•</span>
                              <span className="text-content-secondary">{m.label}</span>
                              {m.unit && <span className="text-content-muted">({m.unit})</span>}
                              <Badge variant="neutral" className="text-[8px] ml-auto">{m.visualization}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Typical Gates */}
                    {selectedIntentConfig.typicalGates && selectedIntentConfig.typicalGates.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
                          <ShieldCheck size={10} />
                          <span>Auto-generated Gates</span>
                        </div>
                        <div className="space-y-0.5">
                          {selectedIntentConfig.typicalGates.map((g) => (
                            <div key={g.name} className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-content-muted">•</span>
                              <span className="text-content-secondary">{g.name}</span>
                              <Badge variant={g.auto_evaluate ? 'info' : 'neutral'} className="text-[8px] ml-auto">
                                {g.auto_evaluate ? 'auto' : 'manual'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Schema fields (when intent type is selected and has summary fields) */}
                {selectedIntentConfig && selectedIntentConfig.summaryFields.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-content-secondary mb-1.5">
                      Parameters
                    </label>
                    <div className="space-y-2 border border-surface-border p-3">
                      {selectedIntentConfig.summaryFields.map((field) => {
                        // Extract the config key from the dot-path (e.g. 'config.solver' -> 'solver')
                        const parts = field.key.split('.');
                        const configKey = parts[parts.length - 1];
                        // Only show config fields, not KPI fields
                        if (field.key.startsWith('kpis.')) return null;
                        return (
                          <div key={field.key}>
                            <label className="block text-[11px] text-content-tertiary mb-0.5">
                              {field.label} {field.unit && <span className="text-content-muted">({field.unit})</span>}
                            </label>
                            <input
                              type={field.format === 'number' ? 'number' : 'text'}
                              value={String(configValues[configKey] ?? '')}
                              onChange={(e) => {
                                const val = field.format === 'number' && e.target.value
                                  ? Number(e.target.value)
                                  : e.target.value;
                                setConfigValues((prev) => ({ ...prev, [configKey]: val }));
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white
                                text-content-primary focus:outline-none focus:border-blue-500"
                              aria-label={field.label}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1.5">
                    Description <span className="text-content-muted font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this card validate or produce?"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-surface-border bg-white
                      text-content-primary placeholder:text-content-muted
                      focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    aria-label="Card description"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={onClose} type="button">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    loading={isPending}
                    disabled={!name.trim()}
                  >
                    Create Card
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

CreateCardDialog.displayName = 'CreateCardDialog';

export default CreateCardDialog;
