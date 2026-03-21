// ============================================================
// PlanDAGNode — Custom ReactFlow node for plan DAG with status colors
// ============================================================

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { PlanStep } from '@/types/board';

export interface PlanDAGNodeData {
  step: PlanStep;
  progress?: number;
  eta?: string;
  [key: string]: unknown;
}

const stepStatusBadgeVariants: Record<string, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  draft: 'neutral',
};

const statusBorderClasses: Record<string, string> = {
  running: 'border-blue-500 animate-pulse bg-blue-50',
  completed: 'border-green-500 bg-green-50',
  failed: 'border-red-500 bg-red-50',
  pending: 'border-slate-200 bg-slate-50',
  draft: 'border-slate-200 bg-slate-50',
};

function PlanDAGNodeInner({ data }: { data: PlanDAGNodeData }) {
  const { step } = data;
  const status = step.status ?? 'pending';
  const borderClass = statusBorderClasses[status] ?? statusBorderClasses.pending;
  const progress = step.progress;
  const isRunning = status === 'running';

  return (
    <div
      className={`border-2 rounded px-3 py-2 min-w-[160px] max-w-[200px] ${borderClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />

      {/* Tool name */}
      <div className="font-medium text-xs text-content-primary truncate">
        {step.tool_name}
      </div>

      {/* Tool version */}
      {step.tool_version && (
        <div className="text-[10px] text-content-muted mt-0.5 truncate">
          v{step.tool_version}
        </div>
      )}

      {/* Status badge */}
      <div className="mt-1.5">
        <Badge
          variant={stepStatusBadgeVariants[status] ?? 'neutral'}
          dot
          className="text-[10px]"
        >
          {status}
        </Badge>
      </div>

      {/* Progress indicator for running nodes */}
      {isRunning && progress != null && progress > 0 && (
        <div className="mt-1 text-xs font-medium text-blue-600">
          {progress}%
          {data.eta && (
            <span className="text-[10px] text-content-muted ml-1">
              (~{data.eta})
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
    </div>
  );
}

const PlanDAGNode = memo(PlanDAGNodeInner);
PlanDAGNode.displayName = 'PlanDAGNode';

export default PlanDAGNode;
