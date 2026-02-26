import React, { useState, useMemo } from 'react';
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

const RunsListView: React.FC<RunsListViewProps> = ({ onSelectRun, onStartRun, className }) => {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

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
          <table className="w-full text-sm">
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
            <tbody className="divide-y divide-surface-border">
              {filtered.map((run) => (
                <tr
                  key={run.id}
                  onClick={() => onSelectRun(run.id)}
                  className="hover:bg-surface-hover cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-content-secondary">
                    {run.id.slice(0, 12)}...
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={toUiRunStatus(run.status) as any} />
                  </td>
                  <td className="px-4 py-2.5 text-content-secondary capitalize">{run.run_type}</td>
                  <td className="px-4 py-2.5 text-content-secondary">
                    {run.started_at ? formatRelativeTime(run.started_at) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-content-secondary tabular-nums">{getDuration(run)}</td>
                  <td className="px-4 py-2.5 text-right text-content-secondary tabular-nums">
                    {formatCost(run.cost_actual || run.cost_estimate)}
                  </td>
                  <td className="px-4 py-2.5 text-content-secondary">{run.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

RunsListView.displayName = 'RunsListView';

export default RunsListView;
