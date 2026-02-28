// ============================================================
// FailureTriagePanel — Failure triage with action required vs insights
// ============================================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { Card, Badge, ProgressBar, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { TriageFailure } from '@/types/board';
import { useTriage, useReproducibility } from '@hooks/useEvidence';

export interface FailureTriagePanelProps {
  boardId: string;
}

function severityBadgeVariant(
  severity: 'critical' | 'warning' | 'info'
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    critical: 'danger',
    warning: 'warning',
    info: 'info',
  };
  return map[severity] ?? 'neutral';
}

function severityIcon(severity: 'critical' | 'warning' | 'info') {
  if (severity === 'critical') return AlertCircle;
  if (severity === 'warning') return AlertTriangle;
  return Info;
}

function severityBorderClass(severity: 'critical' | 'warning' | 'info') {
  if (severity === 'critical') return 'border-l-4 border-l-red-500';
  if (severity === 'warning') return 'border-l-4 border-l-amber-400';
  return 'border-l-4 border-l-slate-300';
}

// --- Triage item ---

function TriageItem({ item }: { item: TriageFailure }) {
  const SeverityIcon = severityIcon(item.severity);

  return (
    <div
      className={`${severityBorderClass(item.severity)} bg-white px-4 py-3`}
    >
      <div className="flex items-start gap-3">
        <SeverityIcon size={16} className="flex-shrink-0 mt-0.5 text-content-muted" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={severityBadgeVariant(item.severity)} className="text-xs">
              {item.severity}
            </Badge>
            <Badge variant="neutral" className="text-xs">
              {item.kpi_key}
            </Badge>
            <span className="text-xs text-content-tertiary">{item.card_name}</span>
          </div>
          <p className="text-sm text-content-primary">{item.action}</p>
          <div className="text-xs font-mono text-content-tertiary mt-1">
            value: {item.value} {item.operator} {item.threshold} (overshoot:{' '}
            {item.overshoot_pct.toFixed(1)}%)
          </div>
          {item.insights.length > 0 && (
            <div className="mt-2 space-y-1">
              {item.insights.map((insight, i) => (
                <p
                  key={i}
                  className={`text-xs ${
                    item.severity === 'info'
                      ? 'italic text-content-tertiary'
                      : 'text-content-secondary'
                  }`}
                >
                  {insight}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Reproducibility Score panel ---

function ReproducibilityPanel({ boardId }: { boardId: string }) {
  const { data: repro, isLoading } = useReproducibility(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (!repro) return null;

  const percent = Math.round(repro.score * 100);
  const barColor =
    repro.interpretation === 'high'
      ? 'bg-green-600'
      : repro.interpretation === 'medium'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const interpretationLabel =
    repro.interpretation === 'high'
      ? 'Highly reproducible'
      : repro.interpretation === 'medium'
        ? 'Moderately reproducible'
        : 'Low reproducibility';

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-content-muted" />
          <h3 className="text-sm font-semibold text-content-primary">
            Reproducibility Score
          </h3>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-content-primary">
              {percent}%
            </span>
            <Badge
              variant={
                repro.interpretation === 'high'
                  ? 'success'
                  : repro.interpretation === 'medium'
                    ? 'warning'
                    : 'danger'
              }
            >
              {interpretationLabel}
            </Badge>
          </div>
          <ProgressBar value={percent} color={barColor} />
          <div className="flex items-center justify-between text-xs text-content-tertiary">
            <span>CV: {repro.cv.toFixed(3)}</span>
            <span>
              {repro.run_count} run{repro.run_count !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

// --- Collapsible section ---

function CollapsibleSection({
  title,
  count,
  defaultExpanded,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left py-2 hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-content-muted" />
        ) : (
          <ChevronRight size={14} className="text-content-muted" />
        )}
        <span className="text-sm font-semibold text-content-primary">
          {title}
        </span>
        <Badge variant="neutral" className="text-xs">
          {count}
        </Badge>
      </button>
      {expanded && <div className="space-y-2 mt-1">{children}</div>}
    </div>
  );
}

// --- Main component ---

const FailureTriagePanel: React.FC<FailureTriagePanelProps> = ({ boardId }) => {
  const { data: triage, isLoading, error } = useTriage(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="text-sm text-status-danger">
            Failed to load triage data:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </Card.Body>
      </Card>
    );
  }

  const failures = triage?.failures ?? [];

  if (failures.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={CheckCircle2}
          heading="No issues found"
          description="All metrics are within their thresholds. Great job!"
        />
        <ReproducibilityPanel boardId={boardId} />
      </div>
    );
  }

  // Split into action required (critical/warning) and insights (info)
  const actionRequired = failures.filter(
    (f) => f.severity === 'critical' || f.severity === 'warning'
  );
  const insights = failures.filter((f) => f.severity === 'info');

  return (
    <div className="space-y-4">
      <Card>
        <Card.Header>
          <h3 className="text-sm font-semibold text-content-primary">
            Failure Triage
          </h3>
        </Card.Header>
        <Card.Body className="space-y-4">
          {/* Action Required section */}
          <CollapsibleSection
            title="Action Required"
            count={actionRequired.length}
            defaultExpanded={true}
          >
            {actionRequired.length === 0 ? (
              <p className="text-xs text-content-tertiary pl-5">
                No action items.
              </p>
            ) : (
              actionRequired.map((item, i) => (
                <TriageItem key={`${item.card_id}-${item.kpi_key}-${i}`} item={item} />
              ))
            )}
          </CollapsibleSection>

          {/* Insights section */}
          <CollapsibleSection
            title="Insights"
            count={insights.length}
            defaultExpanded={false}
          >
            {insights.length === 0 ? (
              <p className="text-xs text-content-tertiary pl-5">
                No additional insights.
              </p>
            ) : (
              insights.map((item, i) => (
                <TriageItem key={`${item.card_id}-${item.kpi_key}-${i}`} item={item} />
              ))
            )}
          </CollapsibleSection>
        </Card.Body>
      </Card>

      {/* Reproducibility score */}
      <ReproducibilityPanel boardId={boardId} />
    </div>
  );
};

FailureTriagePanel.displayName = 'FailureTriagePanel';

export default FailureTriagePanel;
