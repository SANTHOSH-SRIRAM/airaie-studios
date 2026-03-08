import React, { useState, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn, StatusBadge, Spinner, EmptyState } from '@airaie/ui';
import { Play } from 'lucide-react';
import { formatRelativeTime, formatDuration, formatCost } from '@airaie/ui';
import type { KernelRun } from '@airaie/shared';
import { toUiRunStatus, calcElapsedSeconds } from '@airaie/shared';
import { useRuns } from '@hooks/useRuns';
import RunsFilter from './RunsFilter';

export interface RunsListViewProps {
  onSelectRun: (runId: string) => void;
  onStartRun: () => void;
  className?: string;
}

const ROW_HEIGHT = 44;

const RunsListView: React.FC<RunsListViewProps> = React.memo(({ onSelectRun, onStartRun, className }) => {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: runs, isLoading } = useRuns(status ? { status } : undefined);

  const filtered = useMemo(() => {
    if (!runs) return [];
    if (!search) return runs;
    const q = search.toLowerCase();
    return runs.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.actor.toLowerCase().includes(q) ||
        r.run_type.toLowerCase().includes(q)
    );
  }, [runs, search]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const getDuration = (run: KernelRun): string => {
    const seconds = calcElapsedSeconds(run.started_at, run.completed_at);
    return seconds !== null ? formatDuration(seconds) : '—';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <RunsFilter
          status={status}
          search={search}
          onStatusChange={setStatus}
          onSearchChange={setSearch}
        />
        <button
          onClick={onStartRun}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-brand-secondary text-white hover:bg-brand-secondary-dark transition-colors"
          aria-label="Start new run"
        >
          <Play size={14} />
          Start Run
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Play}
          heading="No runs found"
          description={status ? 'Try changing the status filter.' : 'Start a new run to see it here.'}
        />
      ) : (
        <div className="border border-surface-border overflow-hidden">
          <table className="w-full text-sm" role="grid" aria-label="Workflow runs">
            <thead>
              <tr className="bg-surface-hover border-b border-surface-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Run ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Started</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Duration</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Cost</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Actor</th>
              </tr>
            </thead>
          </table>
          <div ref={parentRef} className="overflow-auto max-h-[600px]">
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const run = filtered[virtualRow.index];
                return (
                  <div
                    key={run.id}
                    role="row"
                    tabIndex={0}
                    onClick={() => onSelectRun(run.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelectRun(run.id); }}
                    className="flex items-center hover:bg-surface-hover cursor-pointer transition-colors border-b border-surface-border"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <span className="px-4 py-2.5 font-mono text-xs text-content-secondary w-[14.28%]">
                      {run.id.slice(0, 12)}...
                    </span>
                    <span className="px-4 py-2.5 w-[14.28%]">
                      <StatusBadge status={toUiRunStatus(run.status) as any} />
                    </span>
                    <span className="px-4 py-2.5 text-content-secondary capitalize w-[14.28%]">{run.run_type}</span>
                    <span className="px-4 py-2.5 text-content-secondary w-[14.28%]">
                      {run.started_at ? formatRelativeTime(run.started_at) : '—'}
                    </span>
                    <span className="px-4 py-2.5 text-content-secondary tabular-nums w-[14.28%]">{getDuration(run)}</span>
                    <span className="px-4 py-2.5 text-right text-content-secondary tabular-nums w-[14.28%]">
                      {formatCost(run.cost_actual || run.cost_estimate)}
                    </span>
                    <span className="px-4 py-2.5 text-content-secondary w-[14.28%]">{run.actor}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

RunsListView.displayName = 'RunsListView';

export default RunsListView;
