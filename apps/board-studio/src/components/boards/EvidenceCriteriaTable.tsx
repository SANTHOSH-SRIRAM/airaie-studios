// ============================================================
// EvidenceCriteriaTable — evidence values vs thresholds with margin
// ============================================================

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Minus } from 'lucide-react';
import { Badge } from '@airaie/ui';
import type { CardEvidence } from '@api/cards';
import type { EvidenceMetricSchema } from '@/types/vertical-registry';
import EvidenceGauge from './EvidenceGauge';
import EvidenceBar from './EvidenceBar';
import EvidenceSparkline from './EvidenceSparkline';

export interface EvidenceCriteriaTableProps {
  evidence: CardEvidence[];
  compact?: boolean;
  /** When provided, adds an inline visualization column */
  evidenceMetrics?: EvidenceMetricSchema[];
}

// ─── Margin computation ──────────────────────────────────────

type EvalResult = 'pass' | 'fail' | 'warning';

interface EnrichedRow {
  ev: CardEvidence;
  margin: number | null;       // percentage margin from threshold
  marginLabel: string;
  result: EvalResult;
  marginSeverity: 'comfortable' | 'tight' | 'over';
}

function computeMargin(value: number, threshold: number, operator: string): number | null {
  if (threshold === 0) return null;

  switch (operator) {
    case 'lte':
    case 'lt':
      // value should be ≤ threshold → margin = (threshold - value) / threshold
      return ((threshold - value) / Math.abs(threshold)) * 100;
    case 'gte':
    case 'gt':
      // value should be ≥ threshold → margin = (value - threshold) / threshold
      return ((value - threshold) / Math.abs(threshold)) * 100;
    case 'eq':
      return ((threshold - Math.abs(value - threshold)) / Math.abs(threshold)) * 100;
    default:
      return null;
  }
}

function marginSeverity(margin: number | null, passed: boolean): 'comfortable' | 'tight' | 'over' {
  if (!passed) return 'over';
  if (margin == null) return 'comfortable';
  if (Math.abs(margin) < 2) return 'over';
  if (Math.abs(margin) < 10) return 'tight';
  return 'comfortable';
}

function deriveResult(passed: boolean, margin: number | null): EvalResult {
  if (!passed) return 'fail';
  if (margin != null && Math.abs(margin) < 10) return 'warning';
  return 'pass';
}

function enrichRows(evidence: CardEvidence[]): EnrichedRow[] {
  return evidence
    .map((ev): EnrichedRow => {
      const margin = computeMargin(ev.value, ev.threshold, ev.operator);
      const result = deriveResult(ev.passed, margin);
      const sev = marginSeverity(margin, ev.passed);
      const marginLabel = margin != null
        ? `${margin >= 0 ? '+' : ''}${margin.toFixed(1)}%`
        : '—';

      return { ev, margin, marginLabel, result, marginSeverity: sev };
    })
    .sort((a, b) => {
      // failures first, warnings second, passes last
      const order: Record<EvalResult, number> = { fail: 0, warning: 1, pass: 2 };
      return order[a.result] - order[b.result];
    });
}

// ─── Result icon ─────────────────────────────────────────────

function ResultIcon({ result, size = 14 }: { result: EvalResult; size?: number }) {
  switch (result) {
    case 'pass':
      return <CheckCircle2 size={size} className="text-green-600" />;
    case 'fail':
      return <XCircle size={size} className="text-red-500" />;
    case 'warning':
      return <AlertTriangle size={size} className="text-amber-500" />;
  }
}

const marginColorClass: Record<string, string> = {
  comfortable: 'text-green-600',
  tight: 'text-amber-500',
  over: 'text-red-500',
};

const resultBadgeVariant: Record<EvalResult, 'success' | 'danger' | 'warning'> = {
  pass: 'success',
  fail: 'danger',
  warning: 'warning',
};

// ─── Operator display ────────────────────────────────────────

const operatorSymbols: Record<string, string> = {
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  eq: '=',
};

// ─── Inline visualization cell ──────────────────────────────

function InlineViz({
  metric,
  ev,
  compact,
}: {
  metric?: EvidenceMetricSchema;
  ev: CardEvidence;
  compact: boolean;
}) {
  if (!metric) return <span className="text-[10px] text-content-muted">—</span>;

  const { min, max } = metric.typical_range;

  switch (metric.visualization) {
    case 'gauge':
      return (
        <EvidenceGauge
          value={ev.value}
          min={min}
          max={max}
          threshold={ev.threshold}
          operator={ev.operator as any}
          unit={metric.unit}
          size="sm"
        />
      );
    case 'bar':
      return (
        <EvidenceBar
          value={ev.value}
          min={min}
          max={max}
          threshold={ev.threshold}
          operator={ev.operator as any}
          unit={metric.unit}
          compact={compact}
        />
      );
    case 'sparkline':
      // Sparkline needs historical values; show value text as fallback
      return (
        <span className="text-[10px] text-content-primary studio-mono">
          {Number.isInteger(ev.value) ? ev.value : ev.value.toFixed(2)}
          {metric.unit && <span className="text-content-muted ml-0.5">{metric.unit}</span>}
        </span>
      );
    default:
      return (
        <span className="text-[10px] text-content-primary studio-mono">
          {Number.isInteger(ev.value) ? ev.value : ev.value.toFixed(2)}
          {metric.unit && <span className="text-content-muted ml-0.5">{metric.unit}</span>}
        </span>
      );
  }
}

// ─── Main component ─────────────────────────────────────────

const EvidenceCriteriaTable: React.FC<EvidenceCriteriaTableProps> = ({
  evidence,
  compact = false,
  evidenceMetrics,
}) => {
  // Build lookup from criterion key → metric schema for visualization
  const metricByKey = React.useMemo(() => {
    if (!evidenceMetrics) return new Map<string, EvidenceMetricSchema>();
    return new Map(evidenceMetrics.map((m) => [m.key, m]));
  }, [evidenceMetrics]);

  const hasVizColumn = metricByKey.size > 0;
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-content-tertiary py-4">
        No evidence collected yet.
      </p>
    );
  }

  const rows = enrichRows(evidence);

  // Summary counts
  const passCount = rows.filter((r) => r.result === 'pass').length;
  const failCount = rows.filter((r) => r.result === 'fail').length;
  const warnCount = rows.filter((r) => r.result === 'warning').length;

  return (
    <div className="space-y-2">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <h4 className={`font-semibold text-content-secondary uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-xs'}`}>
          Evidence vs. Criteria
        </h4>
        <div className="flex items-center gap-2">
          {passCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-green-600">
              <CheckCircle2 size={10} />{passCount}
            </span>
          )}
          {failCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-red-500">
              <XCircle size={10} />{failCount}
            </span>
          )}
          {warnCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
              <AlertTriangle size={10} />{warnCount}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-surface-border overflow-hidden">
        <table className={`w-full ${compact ? 'text-[11px]' : 'text-xs'}`}>
          <thead>
            <tr className="bg-surface-bg text-content-muted border-b border-surface-border">
              <th className="text-left px-3 py-1.5 font-medium">Criterion</th>
              <th className="text-right px-3 py-1.5 font-medium">Value</th>
              {hasVizColumn && (
                <th className="px-3 py-1.5 font-medium text-center">Viz</th>
              )}
              <th className="text-right px-3 py-1.5 font-medium">Target</th>
              {!compact && (
                <th className="text-right px-3 py-1.5 font-medium">Margin</th>
              )}
              <th className="text-center px-3 py-1.5 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {rows.map(({ ev, marginLabel, result, marginSeverity: sev }) => (
              <tr key={ev.id} className={result === 'fail' ? 'bg-red-50/30' : ''}>
                <td className="px-3 py-1.5 text-content-primary font-medium">
                  {ev.criterion}
                </td>
                <td className="px-3 py-1.5 text-right studio-mono">
                  {ev.value}
                </td>
                {hasVizColumn && (
                  <td className="px-3 py-1.5">
                    <InlineViz metric={metricByKey.get(ev.criterion)} ev={ev} compact={compact} />
                  </td>
                )}
                <td className="px-3 py-1.5 text-right studio-mono text-content-muted">
                  {operatorSymbols[ev.operator] ?? ev.operator} {ev.threshold}
                </td>
                {!compact && (
                  <td className={`px-3 py-1.5 text-right studio-mono ${marginColorClass[sev]}`}>
                    {marginLabel}
                  </td>
                )}
                <td className="px-3 py-1.5 text-center">
                  <Badge variant={resultBadgeVariant[result]} className="text-[9px]">
                    <span className="flex items-center gap-0.5">
                      <ResultIcon result={result} size={10} />
                      {result.toUpperCase()}
                    </span>
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

EvidenceCriteriaTable.displayName = 'EvidenceCriteriaTable';

export default EvidenceCriteriaTable;
