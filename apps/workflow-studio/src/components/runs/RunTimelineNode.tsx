import React from 'react';
import { cn, StatusBadge, ProgressBar } from '@airaie/ui';
import { formatDuration, formatCost } from '@airaie/ui';
import type { KernelNodeRun } from '@airaie/shared';
import { toUiNodeRunStatus, calcElapsedSeconds } from '@airaie/shared';

export interface RunTimelineNodeProps {
  nodeRun: KernelNodeRun;
  progress?: number;
}

const RunTimelineNode: React.FC<RunTimelineNodeProps> = ({ nodeRun, progress }) => {
  const seconds = calcElapsedSeconds(nodeRun.started_at, nodeRun.completed_at);
  const duration = seconds !== null ? formatDuration(seconds) : '—';

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-surface-border hover:bg-surface-hover transition-colors">
      <div className="mt-0.5">
        <StatusBadge status={toUiNodeRunStatus(nodeRun.status) as any} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-content-primary truncate">{nodeRun.node_id}</span>
          <code className="text-xs text-content-muted font-mono">{nodeRun.tool_ref}</code>
        </div>
        <div className="flex items-center gap-4 text-xs text-content-tertiary">
          <span>{duration}</span>
          <span>{formatCost(nodeRun.cost_actual || nodeRun.cost_estimate)}</span>
          <span>Attempt {nodeRun.attempt}</span>
        </div>
        {progress !== undefined && nodeRun.status === 'RUNNING' && (
          <ProgressBar value={progress} className="mt-1" />
        )}
      </div>
    </div>
  );
};

RunTimelineNode.displayName = 'RunTimelineNode';

export default RunTimelineNode;
