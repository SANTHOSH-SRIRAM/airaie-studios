// ============================================================
// DecisionTraceViewer — shows decision trace timeline for a run
// ============================================================

import React, { useState } from 'react';
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Shield,
  Wrench,
  Settings,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useDecisionTraces } from '@hooks/useRuns';
import type { DecisionTrace, DecisionType } from '@/types/execution';
import { formatDateTime } from '@airaie/ui';

interface DecisionTraceViewerProps {
  runId: string;
}

const decisionTypeConfig: Record<
  DecisionType,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  tool_selection: { label: 'Tool Selection', icon: Wrench, variant: 'info' },
  parameter_override: { label: 'Parameter Override', icon: Settings, variant: 'warning' },
  gate_evaluation: { label: 'Gate Evaluation', icon: Shield, variant: 'success' },
  plan_generation: { label: 'Plan Generation', icon: Lightbulb, variant: 'neutral' },
  evidence_assessment: { label: 'Evidence Assessment', icon: TrendingUp, variant: 'info' },
  escalation: { label: 'Escalation', icon: AlertTriangle, variant: 'danger' },
  retry: { label: 'Retry', icon: RefreshCw, variant: 'warning' },
};

function TraceItem({ trace }: { trace: DecisionTrace }) {
  const [expanded, setExpanded] = useState(false);
  const config = decisionTypeConfig[trace.decision_type] ?? decisionTypeConfig.plan_generation;
  const Icon = config.icon;

  return (
    <div className="relative pl-6">
      {/* Timeline dot */}
      <div className="absolute left-0 top-1">
        <Icon size={14} className="text-content-secondary" />
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left group"
        >
          {expanded ? (
            <ChevronDown size={12} className="text-content-muted" />
          ) : (
            <ChevronRight size={12} className="text-content-muted" />
          )}
          <span className="text-xs font-medium text-content-primary group-hover:text-brand-secondary transition-colors">
            {trace.title}
          </span>
          <Badge variant={config.variant} className="text-[9px]">
            {config.label}
          </Badge>
          {trace.confidence != null && (
            <span className="text-[10px] text-content-muted ml-auto">
              {Math.round(trace.confidence * 100)}% conf
            </span>
          )}
        </button>

        <p className="text-[11px] text-content-tertiary leading-relaxed">
          {trace.reasoning}
        </p>

        <div className="text-[10px] text-content-muted">
          {formatDateTime(trace.created_at)} &middot; {trace.actor}
        </div>

        {expanded && (
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-surface-border">
            {/* Inputs */}
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

            {/* Outcome */}
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

            {/* Alternatives considered */}
            {trace.alternatives_considered && trace.alternatives_considered.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
                  Alternatives Considered
                </span>
                <div className="mt-1 space-y-1">
                  {trace.alternatives_considered.map((alt, i) => (
                    <div key={i} className="text-[10px] flex gap-2">
                      <span className="text-content-primary font-medium">{alt.label}</span>
                      <span className="text-content-muted">&mdash; {alt.reason_rejected}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const DecisionTraceViewer: React.FC<DecisionTraceViewerProps> = ({ runId }) => {
  const { data: traces, isLoading } = useDecisionTraces(runId);

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
        <span>No decision traces for this run.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 relative">
      {/* Vertical line */}
      <div className="absolute left-[6px] top-3 bottom-3 w-px bg-surface-border" />
      {traces.map((trace) => (
        <TraceItem key={trace.id} trace={trace} />
      ))}
    </div>
  );
};

DecisionTraceViewer.displayName = 'DecisionTraceViewer';

export default DecisionTraceViewer;
