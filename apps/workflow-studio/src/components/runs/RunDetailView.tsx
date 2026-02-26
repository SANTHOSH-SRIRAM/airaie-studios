import React, { useState, useCallback } from 'react';
import { cn, StatusBadge, Button, Tabs } from '@airaie/ui';
import { ArrowLeft, XCircle } from 'lucide-react';
import { formatDateTime, formatDuration, formatCost } from '@airaie/ui';
import type { KernelNodeRun, RunEvent } from '@airaie/shared';
import { toUiRunStatus, calcElapsedSeconds } from '@airaie/shared';
import { useRun, useRunLogs, useCancelRun, useRunStream } from '@hooks/useRuns';
import RunTimeline from './RunTimeline';

export interface RunDetailViewProps {
  runId: string;
  onBack: () => void;
  logsPanel: React.ReactNode;
  artifactsPanel: React.ReactNode;
  costPanel: React.ReactNode;
  className?: string;
}

const tabs = [
  { id: 'logs', label: 'Logs' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'cost', label: 'Cost' },
];

const RunDetailView: React.FC<RunDetailViewProps> = ({
  runId,
  onBack,
  logsPanel,
  artifactsPanel,
  costPanel,
  className,
}) => {
  const { data: run } = useRun(runId);
  const { data: nodeRuns, isLoading: nodeRunsLoading } = useRunLogs(runId);
  const cancelRun = useCancelRun();
  const [activeTab, setActiveTab] = useState('logs');
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const handleEvent = useCallback((event: RunEvent) => {
    if (event.event_type === 'NODE_PROGRESS' && event.node_id) {
      const pct = (event.payload.progress as number) ?? 0;
      setProgressMap((prev) => ({ ...prev, [event.node_id!]: pct }));
    }
  }, []);

  useRunStream(
    run && (run.status === 'RUNNING' || run.status === 'PENDING') ? runId : null,
    handleEvent
  );

  if (!run) return null;

  const seconds = calcElapsedSeconds(run.started_at, run.completed_at);
  const duration = seconds !== null ? formatDuration(seconds) : '—';
  const isActive = run.status === 'RUNNING' || run.status === 'PENDING';

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-white space-y-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-content-muted hover:text-content-primary transition-colors">
            <ArrowLeft size={16} />
          </button>
          <code className="text-sm font-mono text-content-secondary">{run.id.slice(0, 16)}</code>
          <StatusBadge status={toUiRunStatus(run.status) as any} />
          <div className="flex-1" />
          {isActive && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => cancelRun.mutate(runId)}
              loading={cancelRun.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-content-tertiary">
          <span>Duration: {duration}</span>
          <span>Cost: {formatCost(run.cost_actual || run.cost_estimate)}</span>
          {run.started_at && <span>Started: {formatDateTime(run.started_at)}</span>}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <RunTimeline
          nodeRuns={(nodeRuns as KernelNodeRun[]) ?? []}
          progressMap={progressMap}
          isLoading={nodeRunsLoading}
          className="flex-1"
        />
      </div>

      {/* Bottom tabs */}
      <div className="border-t border-surface-border">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <div className="max-h-[250px] overflow-y-auto">
          {activeTab === 'logs' && logsPanel}
          {activeTab === 'artifacts' && artifactsPanel}
          {activeTab === 'cost' && costPanel}
        </div>
      </div>
    </div>
  );
};

RunDetailView.displayName = 'RunDetailView';

export default RunDetailView;
