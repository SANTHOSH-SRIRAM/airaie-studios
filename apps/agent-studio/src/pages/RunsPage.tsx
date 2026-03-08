import React, { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  AlertCircle, Activity, Clock, DollarSign, XCircle,
  CheckCircle2, Loader2, Ban, ShieldAlert,
} from 'lucide-react';
import { Button, Badge, StatusBadge, EmptyState, Spinner, Select, formatRelativeTime, formatDuration, formatCost } from '@airaie/ui';
import { toUiRunStatus, calcElapsedSeconds } from '@airaie/shared';
import type { KernelRun } from '@airaie/shared';
import { useRuns, useCancelRun } from '@hooks/useRuns';
import RunDetailPanel from '@components/runs/RunDetailPanel';
import { useExecutionStore } from '@store/executionStore';
import { cn } from '@airaie/ui';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
];

const statusIcons: Record<string, typeof Activity> = {
  RUNNING: Loader2,
  SUCCEEDED: CheckCircle2,
  FAILED: XCircle,
  CANCELED: Ban,
  AWAITING_APPROVAL: ShieldAlert,
  PENDING: Clock,
};

function RunListItem({ run, selected, onClick }: { run: KernelRun; selected: boolean; onClick: () => void }) {
  const elapsed = calcElapsedSeconds(run.started_at, run.completed_at);
  const StatusIcon = statusIcons[run.status] || Activity;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors',
        selected && 'bg-blue-50 border-l-2 border-l-blue-500'
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon size={14} className={cn(
          run.status === 'RUNNING' && 'text-blue-500 animate-spin',
          run.status === 'SUCCEEDED' && 'text-green-500',
          run.status === 'FAILED' && 'text-red-500',
          run.status === 'CANCELED' && 'text-gray-400',
          run.status === 'AWAITING_APPROVAL' && 'text-amber-500',
        )} />
        <span className="text-xs font-mono text-gray-700 truncate flex-1">{run.id.slice(0, 12)}</span>
        <StatusBadge status={toUiRunStatus(run.status) as any} />
      </div>
      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
        {elapsed !== null && <span>{formatDuration(elapsed)}</span>}
        <span>{formatCost(run.cost_actual)}</span>
        <span className="ml-auto">{formatRelativeTime(run.created_at)}</span>
      </div>
    </button>
  );
}

export default function RunsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const setInspectorItem = useExecutionStore((s) => s.setInspectorItem);

  const { data: rawRuns, isLoading, isError, refetch } = useRuns(
    statusFilter ? { status: statusFilter } : undefined
  );
  const runs = Array.isArray(rawRuns) ? rawRuns : [];
  const selectedRun = runs.find((r) => r.id === selectedRunId);
  const cancelMutation = useCancelRun();

  // Push selected run to inspector
  useEffect(() => {
    if (selectedRun) {
      setInspectorItem({
        type: 'run',
        id: selectedRun.id,
        name: `Run ${selectedRun.id.slice(0, 12)}`,
        data: selectedRun as unknown as Record<string, unknown>,
      });
    }
  }, [selectedRun, setInspectorItem]);

  return (
    <div className="h-full w-full overflow-hidden">
      <Group orientation="horizontal" id="runs-panels" className="h-full w-full">
        {/* Runs list (left) */}
        <Panel id="runs-list" defaultSize="30%" minSize="20%" maxSize="45%">
          <div className="flex flex-col h-full border-r border-gray-200">
            {/* Filter bar */}
            <div className="px-3 py-2 border-b border-gray-100 shrink-0">
              <Select
                options={STATUS_FILTERS}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
              <div className="text-[10px] text-gray-400 mt-1">
                {runs.length} {runs.length === 1 ? 'run' : 'runs'}
              </div>
            </div>

            {/* Runs list */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex justify-center py-8"><Spinner /></div>
              )}
              {isError && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <AlertCircle size={20} className="text-red-500" />
                  <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                </div>
              )}
              {!isLoading && !isError && runs.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <EmptyState icon={Activity} heading="No runs" description="Run an agent to see history here." />
                </div>
              )}
              {runs.map((run) => (
                <RunListItem
                  key={run.id}
                  run={run}
                  selected={selectedRunId === run.id}
                  onClick={() => setSelectedRunId(run.id)}
                />
              ))}
            </div>
          </div>
        </Panel>

        <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

        {/* Run detail (center) */}
        <Panel id="runs-detail" defaultSize="70%" minSize="40%">
          <div className="h-full overflow-auto">
            {!selectedRun ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Select a run from the list to view details.
              </div>
            ) : (
              <div className="p-4">
                {/* Run header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800 font-mono">{selectedRun.id}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={toUiRunStatus(selectedRun.status) as any} />
                      <Badge variant="neutral" badgeStyle="outline">{selectedRun.run_type}</Badge>
                      {selectedRun.agent_id && (
                        <span className="text-xs text-gray-500 font-mono">Agent: {selectedRun.agent_id.slice(0, 12)}</span>
                      )}
                    </div>
                  </div>
                  {(selectedRun.status === 'RUNNING' || selectedRun.status === 'PENDING') && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      onClick={() => cancelMutation.mutate(selectedRun.id)}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Run detail panel */}
                <RunDetailPanel run={selectedRun} />
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
