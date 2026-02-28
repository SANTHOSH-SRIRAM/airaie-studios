// ============================================================
// EvidenceDiffView — Evidence diff table with baseline comparison
// ============================================================

import React from 'react';
import { ArrowUp, ArrowDown, Minus, BarChart3 } from 'lucide-react';
import { Card, Badge, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { EvidenceDiff } from '@/types/board';
import { useEvidenceDiff } from '@hooks/useEvidence';

export interface EvidenceDiffViewProps {
  boardId: string;
}

/**
 * Determine improvement classification based on operator.
 * lt/lte = lower-is-better (negative delta = improved)
 * gt/gte = higher-is-better (positive delta = improved)
 */
function classifyChange(
  diff: EvidenceDiff
): 'improved' | 'regressed' | 'unchanged' {
  if (diff.delta === 0) return 'unchanged';

  const op = diff.operator;
  if (op === 'lt' || op === 'lte' || op === '<' || op === '<=') {
    // Lower is better: negative delta = improved
    return diff.delta < 0 ? 'improved' : 'regressed';
  }
  // Default: higher is better (gt/gte/>/>=)
  return diff.delta > 0 ? 'improved' : 'regressed';
}

function statusBadgeVariant(
  status: 'improved' | 'regressed' | 'unchanged'
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    improved: 'success',
    regressed: 'danger',
    unchanged: 'neutral',
  };
  return map[status] ?? 'neutral';
}

function DeltaCell({
  delta,
  status,
}: {
  delta: number;
  status: 'improved' | 'regressed' | 'unchanged';
}) {
  if (status === 'unchanged') {
    return (
      <span className="flex items-center gap-1 text-content-muted">
        <Minus size={12} />
        0
      </span>
    );
  }

  const isPositive = delta > 0;

  return (
    <span
      className={`flex items-center gap-1 font-mono text-sm ${
        status === 'improved' ? 'text-green-600' : 'text-red-600'
      }`}
    >
      {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {isPositive ? '+' : ''}
      {delta.toFixed(3)}
    </span>
  );
}

// --- Skeleton for loading state ---

function DiffTableSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-8 bg-slate-100 rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-slate-50 rounded" />
      ))}
    </div>
  );
}

// --- Main component ---

const EvidenceDiffView: React.FC<EvidenceDiffViewProps> = ({ boardId }) => {
  const { data: diffs, isLoading, error } = useEvidenceDiff(boardId);

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-sm font-semibold text-content-primary">
            Evidence Comparison
          </h3>
        </Card.Header>
        <Card.Body>
          <DiffTableSkeleton />
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="text-sm text-status-danger">
            Failed to load evidence diff:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!diffs || diffs.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        heading="No baseline evidence for comparison"
        description="Run at least twice to see diffs. Evidence comparison will appear here after multiple runs."
      />
    );
  }

  // Classify each diff
  const classified = diffs.map((d) => ({
    ...d,
    classification: classifyChange(d),
  }));

  const improved = classified.filter((d) => d.classification === 'improved').length;
  const regressed = classified.filter((d) => d.classification === 'regressed').length;
  const unchanged = classified.filter((d) => d.classification === 'unchanged').length;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content-primary">
            Evidence Comparison
          </h3>
          {/* Summary banner */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium">
              {improved} improved
            </span>
            <span className="text-red-600 font-medium">
              {regressed} regressed
            </span>
            <span className="text-content-muted">{unchanged} unchanged</span>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-slate-50">
                <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Card / Metric
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Baseline
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Current
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Delta
                </th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {classified.map((d, i) => (
                <tr
                  key={`${d.card_id}-${d.kpi_key}-${i}`}
                  className="border-b border-surface-border last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="text-content-primary font-medium">
                      {d.kpi_key}
                    </div>
                    <div className="text-xs text-content-tertiary">
                      {d.card_name}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-content-secondary">
                    {d.baseline.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-content-secondary">
                    {d.current.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DeltaCell
                      delta={d.delta}
                      status={d.classification}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant={statusBadgeVariant(d.classification)}>
                      {d.classification}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

EvidenceDiffView.displayName = 'EvidenceDiffView';

export default EvidenceDiffView;
