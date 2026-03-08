// ============================================================
// ExecutionTimeline — horizontal lifecycle stepper for card detail
// ============================================================

import React from 'react';
import {
  Wrench,
  FileText,
  ShieldCheck,
  Play,
  ClipboardCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  SkipForward,
} from 'lucide-react';
import type { Card } from '@/types/board';
import type { PlanResponse } from '@api/plans';
import type { CardEvidence } from '@api/cards';

export interface ExecutionTimelineProps {
  card: Card;
  plan?: PlanResponse | null;
  evidence?: CardEvidence[];
  onStepClick?: (step: string) => void;
}

// ─── Step definitions ────────────────────────────────────────

interface TimelineStep {
  id: string;
  label: string;
  icon: typeof Wrench;
}

const STEPS: TimelineStep[] = [
  { id: 'tool', label: 'Tool', icon: Wrench },
  { id: 'plan', label: 'Plan', icon: FileText },
  { id: 'preflight', label: 'Preflight', icon: ShieldCheck },
  { id: 'execute', label: 'Execute', icon: Play },
  { id: 'evidence', label: 'Evidence', icon: ClipboardCheck },
  { id: 'gate', label: 'Gate', icon: ShieldAlert },
];

type StepState = 'completed' | 'active' | 'failed' | 'skipped' | 'pending';

// ─── Derive step states from card + plan + evidence ──────────

function deriveStepStates(
  card: Card,
  plan?: PlanResponse | null,
  evidence?: CardEvidence[]
): Record<string, { state: StepState; summary: string }> {
  const result: Record<string, { state: StepState; summary: string }> = {};

  // Tool
  if (card.selected_tool) {
    result.tool = {
      state: 'completed',
      summary: `${card.selected_tool.slug}${card.selected_tool.version ? ` v${card.selected_tool.version}` : ''}`,
    };
  } else {
    result.tool = { state: 'pending', summary: 'Not selected' };
  }

  // Plan
  if (plan) {
    const stepCount = plan.steps?.length ?? 0;
    if (plan.status === 'failed') {
      result.plan = { state: 'failed', summary: 'Plan failed' };
    } else if (plan.status === 'draft') {
      result.plan = { state: 'active', summary: `${stepCount} steps · draft` };
    } else {
      result.plan = {
        state: 'completed',
        summary: `${stepCount} steps${card.cost_estimate != null ? ` · ~$${card.cost_estimate.toFixed(0)}` : ''}`,
      };
    }
  } else if (card.selected_tool) {
    result.plan = { state: 'pending', summary: 'Not generated' };
  } else {
    result.plan = { state: 'pending', summary: '—' };
  }

  // Preflight
  if (card.preflight_status === 'passed') {
    const parts: string[] = ['Passed'];
    if (card.preflight_warnings && card.preflight_warnings > 0) {
      parts.push(`${card.preflight_warnings} warn`);
    }
    result.preflight = { state: 'completed', summary: parts.join(' · ') };
  } else if (card.preflight_status === 'failed') {
    result.preflight = {
      state: 'failed',
      summary: `Failed${card.preflight_blockers ? ` · ${card.preflight_blockers} blocker${card.preflight_blockers !== 1 ? 's' : ''}` : ''}`,
    };
  } else if (card.preflight_status === 'pending') {
    result.preflight = { state: 'active', summary: 'Running...' };
  } else if (card.preflight_status === 'skipped') {
    result.preflight = { state: 'skipped', summary: 'Skipped' };
  } else {
    result.preflight = { state: 'pending', summary: '—' };
  }

  // Execute
  if (card.status === 'running') {
    result.execute = {
      state: 'active',
      summary: card.time_estimate ? `ETA: ${card.time_estimate}` : 'Running...',
    };
  } else if (card.status === 'completed' || card.status === 'failed') {
    if (card.actual_duration != null) {
      const mins = Math.round(card.actual_duration / 60000);
      const costStr = card.actual_cost != null ? ` · $${card.actual_cost.toFixed(0)}` : '';
      result.execute = {
        state: card.status === 'failed' ? 'failed' : 'completed',
        summary: `${mins}m${costStr}`,
      };
    } else {
      result.execute = {
        state: card.status === 'failed' ? 'failed' : 'completed',
        summary: card.status === 'failed' ? 'Failed' : 'Done',
      };
    }
  } else {
    result.execute = { state: 'pending', summary: '—' };
  }

  // Evidence
  const evCount = evidence?.length ?? 0;
  const evSummary = card.evidence_summary;
  if (evSummary && evSummary.total > 0) {
    result.evidence = {
      state: evSummary.failed > 0 ? 'failed' : 'completed',
      summary: `${evSummary.passed}/${evSummary.total} pass${evSummary.warnings > 0 ? ` · ${evSummary.warnings} warn` : ''}`,
    };
  } else if (evCount > 0) {
    const passed = evidence!.filter((e) => e.passed).length;
    result.evidence = { state: 'completed', summary: `${passed}/${evCount} pass` };
  } else if (card.status === 'completed' || card.status === 'running') {
    result.evidence = { state: 'pending', summary: 'Pending' };
  } else {
    result.evidence = { state: 'pending', summary: '—' };
  }

  // Gate
  // No direct gate data on card — infer from evidence completeness
  if (evSummary && evSummary.total > 0 && evSummary.failed === 0) {
    result.gate = { state: 'completed', summary: 'Passed' };
  } else if (evSummary && evSummary.failed > 0) {
    result.gate = { state: 'failed', summary: 'Blocked' };
  } else {
    result.gate = { state: 'pending', summary: '—' };
  }

  return result;
}

// ─── Step state styling ──────────────────────────────────────

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case 'completed':
      return <CheckCircle2 size={16} className="text-green-600" />;
    case 'active':
      return <Loader2 size={16} className="text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle size={16} className="text-red-500" />;
    case 'skipped':
      return <SkipForward size={16} className="text-slate-400" />;
    default:
      return <Circle size={16} className="text-slate-300" />;
  }
}

const connectorColors: Record<StepState, string> = {
  completed: 'bg-green-400',
  active: 'bg-blue-400',
  failed: 'bg-red-400',
  skipped: 'bg-slate-200 border-t border-dashed border-slate-300',
  pending: 'bg-slate-200',
};

// ─── Main component ──────────────────────────────────────────

const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  card,
  plan,
  evidence,
  onStepClick,
}) => {
  const states = deriveStepStates(card, plan, evidence);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start min-w-[600px]">
        {STEPS.map((step, i) => {
          const { state, summary } = states[step.id] ?? { state: 'pending' as StepState, summary: '—' };
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {i > 0 && (
                <div className="flex items-center self-center pt-1 -mx-0.5">
                  <div className={`h-0.5 w-6 ${connectorColors[state]}`} />
                </div>
              )}

              {/* Step */}
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={`
                  flex flex-col items-center flex-1 min-w-[80px] max-w-[120px] p-2 rounded
                  transition-colors group
                  ${onStepClick ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* State indicator */}
                <div className="relative mb-1">
                  <StepIcon state={state} />
                  <Icon
                    size={8}
                    className="absolute -bottom-0.5 -right-0.5 text-content-muted"
                  />
                </div>

                {/* Label */}
                <span className={`text-[11px] font-medium ${
                  state === 'active' ? 'text-blue-600' :
                  state === 'completed' ? 'text-green-700' :
                  state === 'failed' ? 'text-red-600' :
                  'text-content-muted'
                }`}>
                  {step.label}
                </span>

                {/* Summary */}
                <span className="text-[9px] text-content-muted mt-0.5 text-center leading-tight">
                  {summary}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

ExecutionTimeline.displayName = 'ExecutionTimeline';

export default ExecutionTimeline;
