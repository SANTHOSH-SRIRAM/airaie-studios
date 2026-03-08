// ============================================================
// CardExecutionPanel — State-machine orchestrator for execution
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Sparkles,
  ShieldCheck,
  Play,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button, Badge, Spinner } from '@airaie/ui';
import type { Card, Board } from '@/types/board';
import type { ExecutionState, ToolRecommendation, CardEvidence } from '@/types/execution';
import { usePlan, useGeneratePlan, useEditPlan, useCompilePlan, useValidatePlan, useExecutePlan, usePlanExecutionStatus } from '@hooks/usePlan';
import { useToolRecommendations, useCardEvidence, useRunPreflight } from '@hooks/useExecution';
import type { PlanResponse } from '@api/plans';
import ToolSelector from './ToolSelector';
import PlanViewer from './PlanViewer';
import PreflightReport from './PreflightReport';
import ExecutionProgress from './ExecutionProgress';

// ─── Props ──────────────────────────────────────────────────

export interface CardExecutionPanelProps {
  card: Card;
  board?: Board;
  onClose?: () => void;
}

// ─── Section collapse helper ────────────────────────────────

type SectionId = 'tool' | 'plan' | 'preflight' | 'progress' | 'evidence';

const sectionVisibility: Record<ExecutionState, Record<SectionId, 'expanded' | 'collapsed' | 'hidden'>> = {
  idle:                { tool: 'expanded',  plan: 'hidden',    preflight: 'hidden',    progress: 'hidden',    evidence: 'hidden' },
  tool_select:         { tool: 'expanded',  plan: 'hidden',    preflight: 'hidden',    progress: 'hidden',    evidence: 'hidden' },
  planning:            { tool: 'collapsed', plan: 'expanded',  preflight: 'hidden',    progress: 'hidden',    evidence: 'hidden' },
  preflight:           { tool: 'collapsed', plan: 'collapsed', preflight: 'expanded',  progress: 'hidden',    evidence: 'hidden' },
  executing:           { tool: 'collapsed', plan: 'collapsed', preflight: 'collapsed', progress: 'expanded',  evidence: 'hidden' },
  evidence_gathering:  { tool: 'collapsed', plan: 'collapsed', preflight: 'collapsed', progress: 'collapsed', evidence: 'expanded' },
  gate_evaluation:     { tool: 'collapsed', plan: 'collapsed', preflight: 'collapsed', progress: 'collapsed', evidence: 'expanded' },
};

// ─── Collapsible section ────────────────────────────────────

function Section({
  title,
  state,
  onToggle,
  children,
}: {
  title: string;
  state: 'expanded' | 'collapsed' | 'hidden';
  onToggle: () => void;
  children: React.ReactNode;
}) {
  if (state === 'hidden') return null;
  const isExpanded = state === 'expanded';

  return (
    <div className="border-b border-surface-border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50/50 transition-colors"
      >
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">{title}</span>
        {isExpanded ? <ChevronDown size={14} className="text-content-muted" /> : <ChevronRight size={14} className="text-content-muted" />}
      </button>
      {isExpanded && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

// ─── Evidence table ─────────────────────────────────────────

function EvidenceTable({ evidence }: { evidence: CardEvidence[] }) {
  if (evidence.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-content-tertiary border border-dashed border-surface-border">
        No evidence collected yet.
      </div>
    );
  }

  return (
    <div className="border border-surface-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-bg text-content-muted border-b border-surface-border">
            <th className="text-left px-3 py-2 font-medium">Metric</th>
            <th className="text-right px-3 py-2 font-medium">Value</th>
            <th className="text-right px-3 py-2 font-medium">Threshold</th>
            <th className="text-center px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {evidence.map((ev) => (
            <tr key={ev.id}>
              <td className="px-3 py-2 text-content-primary font-medium">
                {ev.metric_key}
                {ev.metric_unit && <span className="text-content-muted ml-1">({ev.metric_unit})</span>}
              </td>
              <td className="px-3 py-2 text-right studio-mono">{ev.metric_value}</td>
              <td className="px-3 py-2 text-right studio-mono text-content-muted">
                {ev.operator && ev.threshold != null ? `${ev.operator} ${ev.threshold}` : '—'}
              </td>
              <td className="px-3 py-2 text-center">
                <Badge
                  variant={ev.evaluation === 'pass' ? 'success' : ev.evaluation === 'fail' ? 'danger' : ev.evaluation === 'warning' ? 'warning' : 'neutral'}
                  className="text-[9px]"
                >
                  {ev.evaluation}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

const CardExecutionPanel: React.FC<CardExecutionPanelProps> = ({ card, board, onClose }) => {
  const [execState, setExecState] = useState<ExecutionState>('idle');
  const [selectedTool, setSelectedTool] = useState<ToolRecommendation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [sectionOverrides, setSectionOverrides] = useState<Partial<Record<SectionId, 'expanded' | 'collapsed'>>>({});

  // --- Data hooks (cardId passed to hook constructor) ---
  const { data: tools, isLoading: toolsLoading, error: toolsError } = useToolRecommendations(card.intent_type);
  const { data: plan, isLoading: planLoading } = usePlan(card.id);
  const { data: execStatus } = usePlanExecutionStatus(card.id, execState === 'executing');
  const { data: evidence } = useCardEvidence(card.id);

  // --- Mutations (cardId baked into hook, mutate() takes no args) ---
  const generateMut = useGeneratePlan(card.id);
  const editMut = useEditPlan(card.id);
  const compileMut = useCompilePlan(card.id);
  const validateMut = useValidatePlan(card.id);
  const executeMut = useExecutePlan(card.id);
  const preflightMut = useRunPreflight();

  // --- Initialize state from existing plan ---
  useEffect(() => {
    if (!plan || execState !== 'idle') return;
    if (plan.status === 'validated') setExecState('preflight');
    else if (plan.status === 'executing') setExecState('executing');
    else if (plan.status === 'completed') setExecState('evidence_gathering');
    else if (plan.status === 'draft' && plan.steps?.length > 0) setExecState('planning');
  }, [plan, execState]);

  // --- Watch execution completion ---
  useEffect(() => {
    if (execState !== 'executing' || !execStatus) return;
    if (execStatus.status === 'completed') setExecState('evidence_gathering');
    else if (execStatus.status === 'failed') {
      setExecState('planning');
      setErrorMsg('Execution failed. Check logs for details.');
    }
  }, [execState, execStatus]);

  // --- Section visibility ---
  const getSectionState = (id: SectionId): 'expanded' | 'collapsed' | 'hidden' => {
    return sectionOverrides[id] ?? sectionVisibility[execState]?.[id] ?? 'hidden';
  };

  const toggleSection = (id: SectionId) => {
    const current = getSectionState(id);
    if (current === 'hidden') return;
    setSectionOverrides((prev) => ({ ...prev, [id]: current === 'expanded' ? 'collapsed' : 'expanded' }));
  };

  useEffect(() => { setSectionOverrides({}); }, [execState]);

  // --- Handlers ---
  const handleSelectTool = useCallback((tool: ToolRecommendation) => {
    setSelectedTool(tool);
    setExecState('tool_select');
  }, []);

  const handleGeneratePlan = useCallback(() => {
    setErrorMsg(undefined);
    setExecState('planning');
    generateMut.mutate(undefined, {
      onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Failed to generate plan'),
    });
  }, [generateMut]);

  const handleEditStep = useCallback(
    (stepId: string, parameters: Record<string, unknown>) => {
      editMut.mutate({ steps: [{ id: stepId, parameters }] } as any, {
        onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Failed to save parameters'),
      });
    },
    [editMut]
  );

  const handleValidate = useCallback(() => {
    setErrorMsg(undefined);
    setExecState('preflight');
    preflightMut.mutate(card.id, {
      onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Failed to run preflight'),
    });
  }, [card.id, preflightMut]);

  const handleExecute = useCallback(async () => {
    setErrorMsg(undefined);
    try {
      await compileMut.mutateAsync(undefined);
      await executeMut.mutateAsync(undefined);
      setExecState('executing');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start execution');
    }
  }, [compileMut, executeMut]);

  const handleRerun = useCallback(() => {
    setExecState('idle');
    setSelectedTool(null);
    setErrorMsg(undefined);
    setSectionOverrides({});
  }, []);

  // --- Action buttons ---
  const renderActions = () => {
    switch (execState) {
      case 'idle':
      case 'tool_select':
        return (
          <Button variant="primary" size="sm" icon={Sparkles} onClick={handleGeneratePlan} loading={generateMut.isPending} disabled={execState === 'tool_select' && !selectedTool}>
            Generate Plan
          </Button>
        );
      case 'planning':
        return (
          <Button variant="primary" size="sm" icon={ShieldCheck} onClick={handleValidate} loading={preflightMut.isPending} disabled={!plan}>
            Validate
          </Button>
        );
      case 'preflight': {
        const passed = plan?.preflight_result?.status === 'pass';
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleValidate} loading={preflightMut.isPending}>Re-validate</Button>
            <Button variant="primary" size="sm" icon={Play} onClick={handleExecute} loading={compileMut.isPending || executeMut.isPending} disabled={plan?.preflight_result?.status === 'fail'}>
              Execute
            </Button>
          </div>
        );
      }
      case 'executing':
        return null;
      case 'evidence_gathering':
      case 'gate_evaluation':
        return <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleRerun}>Re-run</Button>;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white border-l border-surface-border shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-content-primary">Card Execution</h2>
            <p className="text-xs text-content-muted mt-0.5 truncate max-w-[350px]">{card.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="neutral" className="text-[10px]">{execState}</Badge>
            {onClose && (
              <button onClick={onClose} className="p-1 text-content-muted hover:text-content-primary transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {(planLoading || toolsLoading) && (
            <div className="flex items-center justify-center py-12"><Spinner /></div>
          )}

          <Section title="Tool Selection" state={getSectionState('tool')} onToggle={() => toggleSection('tool')}>
            <ToolSelector tools={tools ?? []} isLoading={toolsLoading} error={toolsError} selectedToolSlug={selectedTool?.slug} onSelect={handleSelectTool} />
          </Section>

          <Section title="Execution Plan" state={getSectionState('plan')} onToggle={() => toggleSection('plan')}>
            {plan ? (
              <PlanViewer plan={plan} onEditStep={execState === 'planning' ? handleEditStep : undefined} readonly={execState !== 'planning'} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-content-muted py-4">
                {generateMut.isPending ? <><Loader2 size={14} className="animate-spin" />Generating plan...</> : 'No plan generated yet.'}
              </div>
            )}
          </Section>

          <Section title="Preflight Validation" state={getSectionState('preflight')} onToggle={() => toggleSection('preflight')}>
            {plan?.preflight_result ? (
              <PreflightReport result={plan.preflight_result as any} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-content-muted py-4">
                {preflightMut.isPending ? <><Loader2 size={14} className="animate-spin" />Running preflight...</> : 'No preflight results yet.'}
              </div>
            )}
          </Section>

          <Section title="Execution Progress" state={getSectionState('progress')} onToggle={() => toggleSection('progress')}>
            {plan ? <ExecutionProgress plan={plan} /> : <div className="text-xs text-content-muted py-4">Not executing.</div>}
          </Section>

          <Section title="Evidence" state={getSectionState('evidence')} onToggle={() => toggleSection('evidence')}>
            <EvidenceTable evidence={evidence ?? []} />
          </Section>

          {(execState === 'evidence_gathering' || execState === 'gate_evaluation') && (
            <div className="px-5 py-6 text-center">
              <CheckCircle2 size={28} className="text-green-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-content-primary">Execution Complete</h3>
              <p className="text-xs text-content-muted mt-1">Evidence has been collected. Review results above.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-surface-border flex items-center justify-between shrink-0 bg-surface-bg">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {execState === 'evidence_gathering' || execState === 'gate_evaluation' ? 'Done' : 'Cancel'}
          </Button>
          <div>{renderActions()}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

CardExecutionPanel.displayName = 'CardExecutionPanel';

export default CardExecutionPanel;
