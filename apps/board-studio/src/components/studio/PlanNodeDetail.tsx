// ============================================================
// PlanNodeDetail — Inline detail panel shown below DAG on node click
// ============================================================

import React from 'react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { PlanStep } from '@/types/board';

interface PlanNodeDetailProps {
  step: PlanStep;
  onClose: () => void;
}

const stepStatusBadgeVariants: Record<string, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  draft: 'neutral',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function PlanNodeDetail({ step, onClose }: PlanNodeDetailProps) {
  const paramEntries = Object.entries(step.parameters ?? {});
  const outputs = step.parameters?.outputs;

  return (
    <div className="border border-surface-border bg-white rounded mt-2 max-h-48 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-content-primary">
            {step.tool_name}
          </span>
          {step.tool_version && (
            <span className="text-[10px] text-content-muted">
              v{step.tool_version}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-content-muted hover:text-content-primary text-xs px-1"
        >
          Close
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2">
        {/* Status + Duration row */}
        <div className="flex items-center gap-2">
          <Badge
            variant={stepStatusBadgeVariants[step.status] ?? 'neutral'}
            dot
            className="text-[10px]"
          >
            {step.status}
          </Badge>
          {step.duration_ms != null && (
            <span className="text-[10px] text-content-muted">
              {formatDuration(step.duration_ms)}
            </span>
          )}
        </div>

        {/* Inputs */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">Inputs</span>
          {paramEntries.length === 0 ? (
            <div className="text-xs text-content-tertiary">No parameters</div>
          ) : (
            <div className="space-y-0.5 mt-0.5">
              {paramEntries
                .filter(([key]) => key !== 'outputs')
                .map(([key, val]) => (
                  <div key={key} className="text-xs truncate">
                    <span className="text-content-muted">{key}:</span>{' '}
                    <span className="text-content-primary">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Outputs */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">Outputs</span>
          {outputs ? (
            <div className="text-xs text-content-primary mt-0.5">
              {typeof outputs === 'object' ? JSON.stringify(outputs) : String(outputs)}
            </div>
          ) : (
            <div className="text-xs text-content-tertiary">
              Outputs determined at runtime
            </div>
          )}
        </div>

        {/* Error message */}
        {step.status === 'failed' && step.error && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {step.error}
          </div>
        )}

        {/* Logs placeholder */}
        <div className="text-[10px] text-content-tertiary italic">
          Logs available after execution
        </div>
      </div>
    </div>
  );
}
