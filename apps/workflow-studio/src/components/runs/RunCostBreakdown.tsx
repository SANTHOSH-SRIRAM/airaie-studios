import React from 'react';
import { cn } from '@airaie/ui';
import { formatCost } from '@airaie/ui';
import type { KernelNodeRun } from '@airaie/shared';

export interface RunCostBreakdownProps {
  nodeRuns: KernelNodeRun[];
  className?: string;
}

const RunCostBreakdown: React.FC<RunCostBreakdownProps> = ({ nodeRuns, className }) => {
  const totalEstimate = nodeRuns.reduce((sum, nr) => sum + nr.cost_estimate, 0);
  const totalActual = nodeRuns.reduce((sum, nr) => sum + nr.cost_actual, 0);
  const maxCost = Math.max(...nodeRuns.map((nr) => Math.max(nr.cost_estimate, nr.cost_actual)), 0.01);

  return (
    <div className={cn('p-4 space-y-3', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-content-secondary">Total Estimated: {formatCost(totalEstimate)}</span>
        <span className="font-medium text-content-primary">Total Actual: {formatCost(totalActual)}</span>
      </div>

      {nodeRuns.length === 0 ? (
        <p className="text-sm text-content-muted text-center py-4">No cost data available.</p>
      ) : (
        <div className="space-y-2">
          {nodeRuns.map((nr) => (
            <div key={nr.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-content-secondary truncate max-w-[50%]">{nr.node_id}</span>
                <span className="text-content-muted tabular-nums">
                  {formatCost(nr.cost_actual)} / {formatCost(nr.cost_estimate)}
                </span>
              </div>
              <div className="relative h-4 bg-slate-100">
                {/* Estimate bar (lighter) */}
                <div
                  className="absolute inset-y-0 left-0 bg-blue-200"
                  style={{ width: `${(nr.cost_estimate / maxCost) * 100}%` }}
                />
                {/* Actual bar (darker) */}
                <div
                  className="absolute inset-y-0 left-0 bg-brand-secondary"
                  style={{ width: `${(nr.cost_actual / maxCost) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-content-muted pt-1">
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-200 inline-block" /> Estimate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 bg-brand-secondary inline-block" /> Actual</span>
      </div>
    </div>
  );
};

RunCostBreakdown.displayName = 'RunCostBreakdown';

export default RunCostBreakdown;
