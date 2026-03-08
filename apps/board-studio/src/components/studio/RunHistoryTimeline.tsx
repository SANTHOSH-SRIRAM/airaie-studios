// ============================================================
// RunHistoryTimeline — card run history with timeline view + type filter
// ============================================================

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Loader2, Filter } from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import { useCardRuns } from '@hooks/useCards';
import { fetchCardEvidence, type CardEvidence } from '@api/cards';
import { useQuery } from '@tanstack/react-query';
import type { RunType } from '@/types/execution';

interface RunHistoryTimelineProps {
  cardId: string;
}

const RUN_TYPE_OPTIONS: { value: '' | RunType; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'tool', label: 'Tool' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'agent', label: 'Agent' },
];

function RunDetail({ runId, cardId }: { runId: string; cardId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: evidence } = useQuery({
    queryKey: ['card-evidence', cardId, runId],
    queryFn: () => fetchCardEvidence(cardId, { run_id: runId }),
    enabled: expanded,
  });

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors"
      >
        Show evidence
      </button>
    );
  }

  return (
    <div className="mt-1.5 space-y-1 pl-2 border-l-2 border-surface-border">
      {!evidence && <Spinner />}
      {evidence && evidence.length === 0 && (
        <span className="text-[10px] text-content-muted">No evidence</span>
      )}
      {evidence?.map((ev) => (
        <div key={ev.id} className="flex items-center gap-2 text-[10px]">
          {ev.passed ? (
            <CheckCircle2 size={10} className="text-green-600" />
          ) : (
            <XCircle size={10} className="text-red-500" />
          )}
          <span className="text-content-secondary">{ev.criterion}</span>
          <span className="studio-mono text-content-muted">
            {ev.value} {ev.operator} {ev.threshold}
          </span>
        </div>
      ))}
      <button
        onClick={() => setExpanded(false)}
        className="text-[10px] text-content-muted hover:text-content-primary transition-colors"
      >
        Hide
      </button>
    </div>
  );
}

const RunHistoryTimeline: React.FC<RunHistoryTimelineProps> = ({ cardId }) => {
  const { data: runs, isLoading } = useCardRuns(cardId);
  const [typeFilter, setTypeFilter] = useState<'' | RunType>('');

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    if (!typeFilter) return runs;
    return runs.filter((r) => (r as any).run_type === typeFilter);
  }, [runs, typeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return <span className="text-xs text-content-muted">No runs yet</span>;
  }

  return (
    <div className="space-y-2">
      {/* Type filter */}
      <div className="flex items-center gap-2">
        <Filter size={12} className="text-content-muted" />
        <div className="flex gap-1">
          {RUN_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTypeFilter(opt.value)}
              className={`text-[10px] px-2 py-0.5 border transition-colors ${
                typeFilter === opt.value
                  ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
                  : 'border-surface-border text-content-muted hover:text-content-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {typeFilter && (
          <span className="text-[10px] text-content-muted">
            {filteredRuns.length} of {runs.length}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-2 relative">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-surface-border" />

        {filteredRuns.map((run) => {
          const statusIcon =
            run.status === 'completed' ? <CheckCircle2 size={12} className="text-green-600" /> :
            run.status === 'failed' ? <XCircle size={12} className="text-red-500" /> :
            run.status === 'running' ? <Loader2 size={12} className="text-blue-500 animate-spin" /> :
            <Clock size={12} className="text-content-muted" />;

          const duration = run.duration_ms != null
            ? run.duration_ms < 1000
              ? `${run.duration_ms}ms`
              : `${(run.duration_ms / 1000).toFixed(1)}s`
            : null;

          return (
            <div key={run.id} className="relative pl-5">
              {/* Timeline dot */}
              <div className="absolute left-0 top-0.5">{statusIcon}</div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-content-primary studio-mono">
                    {run.id.slice(0, 8)}
                  </span>
                  <Badge
                    variant={
                      run.status === 'completed' ? 'success' :
                      run.status === 'failed' ? 'danger' :
                      run.status === 'running' ? 'info' : 'neutral'
                    }
                    className="text-[9px]"
                  >
                    {run.status}
                  </Badge>
                  {(run as any).run_type && (
                    <Badge variant="neutral" className="text-[9px]">
                      {(run as any).run_type}
                    </Badge>
                  )}
                  {duration && (
                    <span className="text-[10px] text-content-muted studio-mono">{duration}</span>
                  )}
                </div>
                {run.started_at && (
                  <div className="text-[10px] text-content-muted">
                    {new Date(run.started_at).toLocaleString()}
                  </div>
                )}
                <RunDetail runId={run.id} cardId={cardId} />
              </div>
            </div>
          );
        })}

        {filteredRuns.length === 0 && (
          <span className="text-xs text-content-muted pl-5">
            No {typeFilter} runs found.
          </span>
        )}
      </div>
    </div>
  );
};

RunHistoryTimeline.displayName = 'RunHistoryTimeline';

export default RunHistoryTimeline;
