// ============================================================
// ExecutionControls — Execute button with auto-preflight and progress
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Play, CheckCircle2, XCircle, RefreshCw, Clock, DollarSign } from 'lucide-react';
import { Card, Badge, Button, Spinner, ProgressBar } from '@airaie/ui';
import {
  usePlan,
  useValidatePlan,
  useExecutePlan,
  usePlanExecutionStatus,
} from '@hooks/usePlan';

export interface ExecutionControlsProps {
  cardId: string | undefined;
}

const ExecutionControls: React.FC<ExecutionControlsProps> = ({ cardId }) => {
  const { data: plan, isLoading: planLoading } = usePlan(cardId);
  const validatePlan = useValidatePlan(cardId);
  const executePlan = useExecutePlan(cardId);
  const [preflightFailed, setPreflightFailed] = useState(false);

  // Poll execution status while plan is executing
  const isExecuting = plan?.status === 'executing';
  const { data: executionStatus } = usePlanExecutionStatus(
    cardId,
    isExecuting
  );

  // Reset preflight failure when plan changes
  useEffect(() => {
    setPreflightFailed(false);
  }, [plan?.id]);

  // Handle "Validate & Execute" flow for draft plans
  const handleValidateAndExecute = useCallback(async () => {
    setPreflightFailed(false);
    try {
      const result = await validatePlan.mutateAsync();
      // Check if preflight passed
      if (result.preflight_result?.status === 'pass') {
        // Auto-execute after successful preflight
        executePlan.mutate();
      } else {
        setPreflightFailed(true);
      }
    } catch {
      setPreflightFailed(true);
    }
  }, [validatePlan, executePlan]);

  if (planLoading) {
    return (
      <div className="flex items-center justify-center h-12">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!plan) return null;

  const status = plan.status;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-content-primary">
        Execution
      </h3>

      <Card>
        <Card.Body>
          {/* Cost/time estimates */}
          {(plan.cost_estimate || plan.time_estimate) && (
            <div className="flex items-center gap-4 mb-3">
              {plan.cost_estimate && (
                <div className="flex items-center gap-1 text-xs text-content-muted">
                  <DollarSign size={12} />
                  Est. cost: {plan.cost_estimate}
                </div>
              )}
              {plan.time_estimate && (
                <div className="flex items-center gap-1 text-xs text-content-muted">
                  <Clock size={12} />
                  Est. time: {plan.time_estimate}
                </div>
              )}
            </div>
          )}

          {/* Draft status: Validate & Execute */}
          {status === 'draft' && (
            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                icon={Play}
                onClick={handleValidateAndExecute}
                loading={validatePlan.isPending || executePlan.isPending}
                disabled={!cardId}
              >
                {validatePlan.isPending
                  ? 'Validating...'
                  : executePlan.isPending
                    ? 'Starting execution...'
                    : 'Validate & Execute'}
              </Button>

              {preflightFailed && (
                <div className="flex items-center gap-2 text-xs text-status-danger">
                  <XCircle size={14} />
                  Preflight validation failed. Review results above before retrying.
                </div>
              )}
            </div>
          )}

          {/* Validated status: Execute directly */}
          {status === 'validated' && (
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={() => executePlan.mutate()}
              loading={executePlan.isPending}
              disabled={!cardId}
            >
              {executePlan.isPending ? 'Starting execution...' : 'Execute'}
            </Button>
          )}

          {/* Executing status: Progress display */}
          {status === 'executing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm font-medium text-content-primary">
                  Executing...
                </span>
              </div>

              {/* Overall progress bar */}
              {executionStatus && (
                <>
                  <ProgressBar
                    value={
                      executionStatus.total_steps > 0
                        ? (executionStatus.completed_steps / executionStatus.total_steps) * 100
                        : 0
                    }
                    label="Step Progress"
                    showPercent
                  />

                  {/* Step-by-step progress */}
                  <div className="space-y-1.5">
                    {executionStatus.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 size={12} className="text-green-600 shrink-0" />
                        ) : step.status === 'running' ? (
                          <Spinner size="sm" className="shrink-0" />
                        ) : step.status === 'failed' ? (
                          <XCircle size={12} className="text-red-600 shrink-0" />
                        ) : (
                          <div className="w-3 h-3 border border-slate-300 shrink-0" />
                        )}
                        <span
                          className={
                            step.status === 'running'
                              ? 'text-content-primary font-medium'
                              : step.status === 'completed'
                                ? 'text-content-secondary line-through'
                                : 'text-content-muted'
                          }
                        >
                          {step.tool_name}
                        </span>
                        <Badge
                          variant={
                            step.status === 'completed'
                              ? 'success'
                              : step.status === 'running'
                                ? 'info'
                                : step.status === 'failed'
                                  ? 'danger'
                                  : 'neutral'
                          }
                          className="text-[10px]"
                        >
                          {step.status}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-content-muted">
                    {executionStatus.completed_steps}/{executionStatus.total_steps} steps completed
                  </div>
                </>
              )}
            </div>
          )}

          {/* Completed status */}
          {status === 'completed' && (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-700">
                  Execution Completed
                </div>
                <div className="text-xs text-content-muted mt-0.5">
                  All steps executed successfully.
                </div>
              </div>
            </div>
          )}

          {/* Failed status */}
          {status === 'failed' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle size={20} className="text-red-600" />
                <div>
                  <div className="text-sm font-medium text-red-700">
                    Execution Failed
                  </div>
                  <div className="text-xs text-content-muted mt-0.5">
                    One or more steps failed during execution.
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={() => executePlan.mutate()}
                loading={executePlan.isPending}
              >
                Retry Execution
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

ExecutionControls.displayName = 'ExecutionControls';

export default ExecutionControls;
