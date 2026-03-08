// ============================================================
// PlanExecutionPanel — full plan lifecycle: Generate → Compile → Validate → Execute
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Sparkles,
  Cpu,
  ShieldCheck,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Wrench,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
} from 'lucide-react';
import { Button, Badge, Spinner } from '@airaie/ui';
import { usePlan, useGeneratePlan, useEditPlan, useCompilePlan, useValidatePlan, useExecutePlan, usePlanExecutionStatus } from '@hooks/usePlan';
import type { PlanStep } from '@/types/board';
import type { PreflightResult, ValidatorResult } from '@api/plans';

export interface PlanExecutionPanelProps {
  open: boolean;
  onClose: () => void;
  cardId: string;
  cardName: string;
}

type PlanPhase = 'idle' | 'generating' | 'generated' | 'compiling' | 'compiled' | 'validating' | 'validated' | 'executing' | 'completed' | 'failed';

const PHASES = [
  { id: 'generate', label: 'Generate', icon: Sparkles, description: 'Create execution plan from card config' },
  { id: 'compile', label: 'Compile', icon: Cpu, description: 'Resolve tools and build execution graph' },
  { id: 'validate', label: 'Validate', icon: ShieldCheck, description: 'Run preflight checks' },
  { id: 'execute', label: 'Execute', icon: Play, description: 'Run the plan' },
] as const;

function phaseIndex(phase: PlanPhase): number {
  switch (phase) {
    case 'idle': return -1;
    case 'generating': return 0;
    case 'generated': return 0;
    case 'compiling': return 1;
    case 'compiled': return 1;
    case 'validating': return 2;
    case 'validated': return 2;
    case 'executing': return 3;
    case 'completed': return 4;
    case 'failed': return -2;
    default: return -1;
  }
}

function phaseStatus(idx: number, currentPhase: PlanPhase): 'done' | 'active' | 'pending' | 'failed' {
  const current = phaseIndex(currentPhase);
  if (currentPhase === 'failed') return idx <= current ? 'failed' : 'pending';
  if (idx < current) return 'done';
  if (idx === current) {
    // If we're in a "doing" state (generating, compiling, etc.) it's active
    if (['generating', 'compiling', 'validating', 'executing'].includes(currentPhase)) return 'active';
    return 'done';
  }
  return 'pending';
}

const PlanExecutionPanel: React.FC<PlanExecutionPanelProps> = ({
  open,
  onClose,
  cardId,
  cardName,
}) => {
  const [phase, setPhase] = useState<PlanPhase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [failedAt, setFailedAt] = useState<PlanPhase | undefined>();
  const [editMode, setEditMode] = useState(false);
  const [editedSteps, setEditedSteps] = useState<PlanStep[]>([]);

  // Plan data & mutations
  const { data: plan, isLoading: planLoading } = usePlan(cardId);
  const generateMutation = useGeneratePlan(cardId);
  const editMutation = useEditPlan(cardId);
  const compileMutation = useCompilePlan(cardId);
  const validateMutation = useValidatePlan(cardId);
  const executeMutation = useExecutePlan(cardId);

  // Poll execution status while executing
  const { data: execStatus } = usePlanExecutionStatus(
    cardId,
    phase === 'executing'
  );

  // Watch execution status for completion
  useEffect(() => {
    if (phase === 'executing' && execStatus) {
      if (execStatus.status === 'completed') {
        setPhase('completed');
      } else if (execStatus.status === 'failed') {
        setPhase('failed');
        setErrorMsg('Execution failed. Check logs for details.');
      }
    }
  }, [phase, execStatus]);

  // Reset when panel opens
  useEffect(() => {
    if (open) {
      setPhase('idle');
      setErrorMsg(undefined);
      setFailedAt(undefined);
    }
  }, [open]);

  // Determine initial phase from existing plan state
  useEffect(() => {
    if (plan && phase === 'idle') {
      switch (plan.status) {
        case 'validated':
          setPhase('validated');
          break;
        case 'executing':
          setPhase('executing');
          break;
        case 'completed':
          setPhase('completed');
          break;
        case 'failed':
          setPhase('failed');
          break;
        default:
          if (plan.steps?.length > 0) {
            setPhase('generated');
          }
          break;
      }
    }
  }, [plan, phase]);

  const handleGenerate = useCallback(() => {
    setPhase('generating');
    setErrorMsg(undefined);
    setFailedAt(undefined);
    generateMutation.mutate(undefined, {
      onSuccess: () => setPhase('generated'),
      onError: (err: any) => {
        setPhase('failed');
        setFailedAt('generating');
        setErrorMsg((err as any)?.message || 'Failed to generate plan');
      },
    });
  }, [generateMutation]);

  const handleCompile = useCallback(() => {
    setPhase('compiling');
    setErrorMsg(undefined);
    setFailedAt(undefined);
    compileMutation.mutate(undefined, {
      onSuccess: () => setPhase('compiled'),
      onError: (err) => {
        setPhase('failed');
        setFailedAt('compiling');
        setErrorMsg((err as any)?.message || 'Failed to compile plan');
      },
    });
  }, [compileMutation]);

  const handleValidate = useCallback(() => {
    setPhase('validating');
    setErrorMsg(undefined);
    setFailedAt(undefined);
    validateMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.preflight_result?.status === 'fail') {
          setPhase('failed');
          setFailedAt('validating');
          setErrorMsg('Preflight validation failed. Fix issues and retry.');
        } else {
          setPhase('validated');
        }
      },
      onError: (err) => {
        setPhase('failed');
        setFailedAt('validating');
        setErrorMsg((err as any)?.message || 'Failed to validate plan');
      },
    });
  }, [validateMutation]);

  const handleExecute = useCallback(() => {
    setPhase('executing');
    setErrorMsg(undefined);
    setFailedAt(undefined);
    executeMutation.mutate(undefined, {
      onError: (err) => {
        setPhase('failed');
        setFailedAt('executing');
        setErrorMsg((err as any)?.message || 'Failed to start execution');
      },
    });
  }, [executeMutation]);

  // One-click: run all steps in sequence
  const handleRunAll = useCallback(async () => {
    setErrorMsg(undefined);
    setFailedAt(undefined);

    // Generate (skip if plan already exists with steps)
    if (!plan?.steps?.length) {
      setPhase('generating');
      try {
        await generateMutation.mutateAsync(undefined);
      } catch (err) {
        setPhase('failed');
        setFailedAt('generating');
        setErrorMsg((err as any)?.message || 'Failed to generate plan');
        return;
      }
      setPhase('generated');
    }

    // Compile
    setPhase('compiling');
    try {
      await compileMutation.mutateAsync(undefined);
    } catch (err) {
      setPhase('failed');
      setFailedAt('compiling');
      setErrorMsg((err as any)?.message || 'Failed to compile plan');
      return;
    }
    setPhase('compiled');

    // Validate
    setPhase('validating');
    try {
      const result = await validateMutation.mutateAsync(undefined);
      if (result.preflight_result?.status === 'fail') {
        setPhase('failed');
        setFailedAt('validating');
        setErrorMsg('Preflight validation failed');
        return;
      }
    } catch (err) {
      setPhase('failed');
      setFailedAt('validating');
      setErrorMsg((err as any)?.message || 'Failed to validate plan');
      return;
    }
    setPhase('validated');

    // Execute
    setPhase('executing');
    try {
      await executeMutation.mutateAsync(undefined);
    } catch (err) {
      setPhase('failed');
      setFailedAt('executing');
      setErrorMsg((err as any)?.message || 'Failed to start execution');
    }
  }, [generateMutation, compileMutation, validateMutation, executeMutation, plan]);

  // --- Step editing handlers ---
  const handleEnterEdit = useCallback(() => {
    if (plan?.steps) {
      setEditedSteps([...plan.steps]);
      setEditMode(true);
    }
  }, [plan]);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
    setEditedSteps([]);
  }, []);

  const handleSaveEdit = useCallback(() => {
    editMutation.mutate(
      { steps: editedSteps },
      {
        onSuccess: () => {
          setEditMode(false);
          setEditedSteps([]);
        },
        onError: (err) => {
          setErrorMsg((err as any)?.message || 'Failed to save plan edits');
        },
      }
    );
  }, [editMutation, editedSteps]);

  const handleMoveStep = useCallback((idx: number, direction: 'up' | 'down') => {
    setEditedSteps((prev) => {
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }, []);

  const handleRemoveStep = useCallback((idx: number) => {
    setEditedSteps((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const nextAction = (): { label: string; handler: () => void } | null => {
    switch (phase) {
      case 'idle': return { label: 'Generate Plan', handler: handleGenerate };
      case 'generated': return { label: 'Compile', handler: handleCompile };
      case 'compiled': return { label: 'Validate', handler: handleValidate };
      case 'validated': return { label: 'Execute', handler: handleExecute };
      case 'failed': {
        // Retry from the failed step instead of always regenerating
        switch (failedAt) {
          case 'validating': return { label: 'Retry Validate', handler: handleValidate };
          case 'compiling': return { label: 'Retry Compile', handler: handleCompile };
          case 'executing': return { label: 'Retry Execute', handler: handleExecute };
          default: return { label: 'Retry from Start', handler: handleGenerate };
        }
      }
      default: return null;
    }
  };

  const action = nextAction();

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

          {/* Panel — slides in from right */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white border-l border-surface-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Plan Execution</h2>
                <p className="text-xs text-content-muted mt-0.5 truncate max-w-[300px]">{cardName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-content-muted hover:text-content-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Phase pipeline */}
            <div className="px-5 py-4 border-b border-surface-border flex-shrink-0">
              <div className="flex items-center gap-1">
                {PHASES.map((p, i) => {
                  const status = phaseStatus(i, phase);
                  const Icon = p.icon;
                  return (
                    <React.Fragment key={p.id}>
                      {i > 0 && (
                        <ChevronRight
                          size={14}
                          className={status === 'done' ? 'text-green-500' : 'text-content-muted'}
                        />
                      )}
                      <div
                        className={`
                          flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-all
                          ${status === 'done' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                          ${status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                          ${status === 'pending' ? 'bg-surface-bg text-content-muted border border-surface-border' : ''}
                          ${status === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                        `}
                      >
                        {status === 'active' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : status === 'done' ? (
                          <CheckCircle2 size={12} />
                        ) : status === 'failed' ? (
                          <XCircle size={12} />
                        ) : (
                          <Icon size={12} />
                        )}
                        {p.label}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Error message */}
              {errorMsg && (
                <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{errorMsg}</p>
                </div>
              )}

              {/* Plan steps — edit mode */}
              {editMode && editedSteps.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                      Edit Steps ({editedSteps.length})
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Save}
                        onClick={handleSaveEdit}
                        loading={editMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {editedSteps.map((step: PlanStep, i: number) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 px-3 py-2.5 border border-blue-200 bg-blue-50/30"
                      >
                        <span className="text-[10px] text-content-muted studio-mono w-5 text-right flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-content-primary truncate">
                            {step.tool_name}
                          </div>
                          <div className="text-[10px] text-content-muted truncate">
                            {step.role}
                            {step.tool_version && ` · v${step.tool_version}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(i, 'up')}
                            disabled={i === 0}
                            className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 transition-colors"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(i, 'down')}
                            disabled={i === editedSteps.length - 1}
                            className="p-1 text-content-muted hover:text-content-primary disabled:opacity-30 transition-colors"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(i)}
                            className="p-1 text-content-muted hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan steps — read mode */}
              {!editMode && plan && plan.steps && plan.steps.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                      Plan Steps ({plan.steps.length})
                    </h3>
                    {(phase === 'generated' || phase === 'idle') && plan.steps.length > 0 && (
                      <button
                        type="button"
                        onClick={handleEnterEdit}
                        className="flex items-center gap-1 text-[10px] text-content-muted hover:text-brand-secondary transition-colors"
                      >
                        <Pencil size={10} />
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {plan.steps.map((step: PlanStep, i: number) => {
                      const execStep = execStatus?.steps?.find((s) => s.id === step.id);
                      const stepStatus = execStep?.status ?? step.status ?? 'pending';
                      return (
                        <div
                          key={step.id}
                          className="flex items-center gap-3 px-3 py-2.5 border border-surface-border bg-white"
                        >
                          <span className="text-[10px] text-content-muted studio-mono w-5 text-right flex-shrink-0">
                            {i + 1}
                          </span>
                          <StepStatusIcon status={stepStatus} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-content-primary truncate">
                              {step.tool_name}
                            </div>
                            <div className="text-[10px] text-content-muted truncate">
                              {step.role}
                              {step.tool_version && ` · v${step.tool_version}`}
                            </div>
                          </div>
                          <Badge
                            variant={
                              stepStatus === 'completed' ? 'success' :
                              stepStatus === 'running' ? 'info' :
                              stepStatus === 'failed' ? 'danger' : 'neutral'
                            }
                            className="text-[9px] flex-shrink-0"
                          >
                            {stepStatus}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Preflight results */}
              {plan?.preflight_result && (
                <div className="px-5 py-4 border-t border-surface-border">
                  <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
                    Preflight Checks
                  </h3>
                  <div className="space-y-1.5">
                    {plan.preflight_result.validators.map((v: ValidatorResult, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {v.status === 'pass' ? (
                          <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle size={13} className="text-red-500 flex-shrink-0" />
                        )}
                        <span className={v.status === 'pass' ? 'text-content-secondary' : 'text-red-700'}>
                          {v.name}
                        </span>
                        {v.message && (
                          <span className="text-content-muted truncate">— {v.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution progress */}
              {phase === 'executing' && execStatus && (
                <div className="px-5 py-4 border-t border-surface-border">
                  <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-3">
                    Execution Progress
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-content-tertiary">Steps completed</span>
                      <span className="font-medium text-content-primary studio-mono">
                        {execStatus.completed_steps}/{execStatus.total_steps}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-bg border border-surface-border">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: execStatus.total_steps
                            ? `${(execStatus.completed_steps / execStatus.total_steps) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Completed state */}
              {phase === 'completed' && (
                <div className="px-5 py-8 text-center">
                  <CheckCircle2 size={32} className="text-green-600 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-content-primary">Execution Complete</h3>
                  <p className="text-xs text-content-muted mt-1">
                    All plan steps finished successfully. Evidence has been collected.
                  </p>
                </div>
              )}

              {/* Empty / idle state */}
              {phase === 'idle' && !plan?.steps?.length && !planLoading && (
                <div className="px-5 py-8 text-center">
                  <Wrench size={28} className="text-content-muted mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-content-primary">No Plan Yet</h3>
                  <p className="text-xs text-content-muted mt-1 max-w-xs mx-auto">
                    Generate an execution plan to resolve tools and build the execution graph for this card.
                  </p>
                </div>
              )}

              {planLoading && (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3.5 border-t border-surface-border flex items-center justify-between flex-shrink-0 bg-surface-bg">
              <Button variant="ghost" size="sm" onClick={onClose}>
                {phase === 'completed' ? 'Done' : 'Cancel'}
              </Button>
              <div className="flex items-center gap-2">
                {phase === 'idle' && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Play}
                    onClick={handleRunAll}
                  >
                    Run All Steps
                  </Button>
                )}
                {action && phase !== 'idle' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={action.handler}
                    loading={['generating', 'compiling', 'validating', 'executing'].includes(phase)}
                    disabled={['generating', 'compiling', 'validating', 'executing'].includes(phase)}
                  >
                    {action.label}
                  </Button>
                )}
                {action && phase === 'idle' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Sparkles}
                    onClick={action.handler}
                  >
                    {action.label}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />;
    case 'running':
      return <Loader2 size={14} className="text-blue-500 animate-spin flex-shrink-0" />;
    case 'failed':
      return <XCircle size={14} className="text-red-500 flex-shrink-0" />;
    default:
      return <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-border flex-shrink-0" />;
  }
}

PlanExecutionPanel.displayName = 'PlanExecutionPanel';

export default PlanExecutionPanel;
