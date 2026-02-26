import React from 'react';
import { cn, Spinner } from '@airaie/ui';
import type { KernelNodeRun } from '@airaie/shared';
import RunTimelineNode from './RunTimelineNode';

export interface RunTimelineProps {
  nodeRuns: KernelNodeRun[];
  progressMap: Record<string, number>;
  isLoading?: boolean;
  className?: string;
}

const RunTimeline: React.FC<RunTimelineProps> = ({ nodeRuns, progressMap, isLoading, className }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size="md" />
      </div>
    );
  }

  if (nodeRuns.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-content-muted">
        No node executions yet.
      </div>
    );
  }

  return (
    <div className={cn('border border-surface-border bg-white overflow-y-auto', className)}>
      {nodeRuns.map((nr) => (
        <RunTimelineNode
          key={nr.id}
          nodeRun={nr}
          progress={progressMap[nr.node_id]}
        />
      ))}
    </div>
  );
};

RunTimeline.displayName = 'RunTimeline';

export default RunTimeline;
