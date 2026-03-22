// ============================================================
// DecisionTraceTimeline — 8-phase horizontal decision timeline
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  FileText,
  BarChart3,
  ShieldCheck,
  Lightbulb,
  Scale,
  GitBranch,
  Play,
  Save,
} from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import { useDecisionTraces } from '@hooks/useRuns';
import type { DecisionTrace, DecisionType } from '@/types/execution';

// ─── Phase definitions ──────────────────────────────────────

export type DecisionPhase =
  | 'context'
  | 'scoring'
  | 'validation'
  | 'proposal'
  | 'policy'
  | 'plan'
  | 'execution'
  | 'recording';

export type PhaseStatus = 'completed' | 'active' | 'pending' | 'skipped';

export interface DecisionPhaseDetail {
  phase: DecisionPhase;
  label: string;
  icon: React.ElementType;
  status: PhaseStatus;
  traces: DecisionTrace[];
}

interface DecisionTraceTimelineProps {
  runId: string;
}

const PHASES: { phase: DecisionPhase; label: string; icon: React.ElementType }[] = [
  { phase: 'context', label: 'Context', icon: FileText },
  { phase: 'scoring', label: 'Scoring', icon: BarChart3 },
  { phase: 'validation', label: 'Validation', icon: ShieldCheck },
  { phase: 'proposal', label: 'Proposal', icon: Lightbulb },
  { phase: 'policy', label: 'Policy', icon: Scale },
  { phase: 'plan', label: 'Plan', icon: GitBranch },
  { phase: 'execution', label: 'Execution', icon: Play },
  { phase: 'recording', label: 'Recording', icon: Save },
];

/** Map DecisionTrace decision_type to a timeline phase */
const DECISION_TYPE_TO_PHASE: Record<DecisionType, DecisionPhase> = {
  parameter_override: 'context',
  tool_selection: 'scoring',
  gate_evaluation: 'validation',
  plan_generation: 'plan',
  evidence_assessment: 'recording',
  escalation: 'policy',
  retry: 'execution',
};

// ─── Status styling ─────────────────────────────────────────

const statusStyles: Record<PhaseStatus, { circle: string; icon: string; line: string }> = {
  completed: {
    circle: 'bg-green-500',
    icon: 'text-white',
    line: 'border-green-500 border-solid',
  },
  active: {
    circle: 'ring-2 ring-blue-500 bg-white',
    icon: 'text-blue-500',
    line: 'border-blue-400 border-dashed',
  },
  pending: {
    circle: 'bg-slate-200',
    icon: 'text-slate-400',
    line: 'border-slate-300 border-dashed',
  },
  skipped: {
    circle: 'bg-slate-200',
    icon: 'text-slate-300',
    line: 'border-slate-200 border-dashed',
  },
};

// ─── Component ──────────────────────────────────────────────

const DecisionTraceTimeline: React.FC<DecisionTraceTimelineProps> = ({ runId }) => {
  const { data: traces, isLoading } = useDecisionTraces(runId);
  const [selectedPhase, setSelectedPhase] = useState<DecisionPhase | null>(null);

  // Build phase details from traces
  const phaseDetails: DecisionPhaseDetail[] = useMemo(() => {
    if (!traces || traces.length === 0) {
      return PHASES.map((p) => ({ ...p, status: 'pending' as PhaseStatus, traces: [] }));
    }

    // Group traces by phase
    const tracesByPhase = new Map<DecisionPhase, DecisionTrace[]>();
    for (const trace of traces) {
      const phase = DECISION_TYPE_TO_PHASE[trace.decision_type];
      if (phase) {
        const existing = tracesByPhase.get(phase) ?? [];
        existing.push(trace);
        tracesByPhase.set(phase, existing);
      }
    }

    // Determine the last completed phase index for active detection
    let lastCompletedIdx = -1;
    for (let i = 0; i < PHASES.length; i++) {
      if (tracesByPhase.has(PHASES[i].phase)) {
        lastCompletedIdx = i;
      }
    }

    return PHASES.map((p, idx) => {
      const phaseTraces = tracesByPhase.get(p.phase) ?? [];
      let status: PhaseStatus;
      if (phaseTraces.length > 0) {
        status = idx === lastCompletedIdx ? 'active' : 'completed';
      } else {
        status = 'pending';
      }
      return { ...p, status, traces: phaseTraces };
    });
  }, [traces]);

  const selectedDetail = useMemo(
    () => phaseDetails.find((d) => d.phase === selectedPhase) ?? null,
    [phaseDetails, selectedPhase]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!traces || traces.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-content-muted py-2">
        <GitBranch size={14} />
        <span>No decision trace data available.</span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Horizontal timeline */}
      <div className="overflow-x-auto pb-2" role="list" aria-label="Decision phases">
        <div className="flex items-start gap-0 min-w-max px-2">
          {phaseDetails.map((detail, idx) => {
            const Icon = detail.icon;
            const style = statusStyles[detail.status];
            const isSelected = selectedPhase === detail.phase;
            const isClickable = detail.status === 'completed' || detail.status === 'active';

            return (
              <div key={detail.phase} className="flex items-start">
                {/* Phase step */}
                <button
                  type="button"
                  className={`flex flex-col items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                    isClickable ? 'cursor-pointer hover:bg-surface-hover' : 'cursor-default'
                  } ${isSelected ? 'bg-surface-hover' : ''}`}
                  onClick={() => {
                    if (!isClickable) return;
                    setSelectedPhase(isSelected ? null : detail.phase);
                  }}
                  aria-label={`${detail.label} - ${detail.status}`}
                  role="listitem"
                >
                  {/* Circle with icon */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${style.circle} ${
                      detail.status === 'active' ? 'animate-pulse' : ''
                    }`}
                  >
                    <Icon size={14} className={style.icon} />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      detail.status === 'skipped' ? 'line-through text-slate-400' : 'text-content-secondary'
                    }`}
                  >
                    {detail.label}
                  </span>

                  {/* Step number */}
                  <span className="text-[9px] text-content-muted">{idx + 1}</span>
                </button>

                {/* Connecting line */}
                {idx < phaseDetails.length - 1 && (
                  <div className="flex items-center pt-4">
                    <div
                      className={`w-8 border-t-2 ${style.line}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline detail panel */}
      {selectedDetail && (
        <div className="border-t border-surface-border p-4 space-y-3" data-testid="phase-detail-panel">
          {/* Phase header */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-content-primary">{selectedDetail.label}</span>
            <Badge
              variant={
                selectedDetail.status === 'completed'
                  ? 'success'
                  : selectedDetail.status === 'active'
                    ? 'info'
                    : 'neutral'
              }
              className="text-[9px]"
            >
              {selectedDetail.status}
            </Badge>
          </div>

          {selectedDetail.traces.length > 0 ? (
            <div className="space-y-3">
              {selectedDetail.traces.map((trace) => (
                <div key={trace.id} className="space-y-2">
                  <p className="text-[11px] text-content-secondary leading-relaxed">
                    {trace.reasoning}
                  </p>

                  {Object.keys(trace.inputs).length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
                        Inputs
                      </span>
                      <pre className="text-[10px] text-content-primary bg-surface-hover p-2 mt-1 overflow-x-auto">
                        {JSON.stringify(trace.inputs, null, 2)}
                      </pre>
                    </div>
                  )}

                  {Object.keys(trace.outcome).length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
                        Outcome
                      </span>
                      <pre className="text-[10px] text-content-primary bg-surface-hover p-2 mt-1 overflow-x-auto">
                        {JSON.stringify(trace.outcome, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-content-muted italic">
              No data recorded for this phase
            </p>
          )}
        </div>
      )}
    </div>
  );
};

DecisionTraceTimeline.displayName = 'DecisionTraceTimeline';

export default DecisionTraceTimeline;
