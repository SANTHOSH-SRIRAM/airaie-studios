// ============================================================
// EvidenceComparisonPanel — side-by-side evidence comparison across runs
// ============================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import { useCardEvidence } from '@hooks/useEvidence';
import type { CardEvidence, CardRun } from '@api/cards';

export interface EvidenceComparisonPanelProps {
  cardId: string;
  baselineRun: CardRun;
  compareRun: CardRun;
  onClose: () => void;
}

// ─── Delta computation ──────────────────────────────────────

interface ComparisonRow {
  criterion: string;
  baselineValue: number | null;
  compareValue: number | null;
  threshold: number;
  operator: string;
  deltaAbs: number | null;
  deltaPct: number | null;
  trend: 'better' | 'worse' | 'same' | 'unknown';
  baselinePassed: boolean | null;
  comparePassed: boolean | null;
}

function computeTrend(
  baseline: number,
  compare: number,
  operator: string
): 'better' | 'worse' | 'same' {
  if (baseline === compare) return 'same';
  const increased = compare > baseline;
  // For gte/gt operators, higher is better
  if (operator === 'gte' || operator === 'gt') return increased ? 'better' : 'worse';
  // For lte/lt operators, lower is better
  if (operator === 'lte' || operator === 'lt') return increased ? 'worse' : 'better';
  // For eq, closer to threshold is better (handled by abs diff)
  return 'same';
}

function buildComparisonRows(
  baselineEvidence: CardEvidence[],
  compareEvidence: CardEvidence[]
): ComparisonRow[] {
  const baseMap = new Map(baselineEvidence.map((e) => [e.criterion, e]));
  const compMap = new Map(compareEvidence.map((e) => [e.criterion, e]));

  // Union of all criteria
  const allCriteria = new Set([...baseMap.keys(), ...compMap.keys()]);
  const rows: ComparisonRow[] = [];

  for (const criterion of allCriteria) {
    const base = baseMap.get(criterion);
    const comp = compMap.get(criterion);

    const bVal = base?.value ?? null;
    const cVal = comp?.value ?? null;
    const threshold = comp?.threshold ?? base?.threshold ?? 0;
    const operator = comp?.operator ?? base?.operator ?? 'gte';

    let deltaAbs: number | null = null;
    let deltaPct: number | null = null;
    let trend: ComparisonRow['trend'] = 'unknown';

    if (bVal != null && cVal != null) {
      deltaAbs = cVal - bVal;
      deltaPct = bVal !== 0 ? (deltaAbs / Math.abs(bVal)) * 100 : null;
      trend = computeTrend(bVal, cVal, operator);
    }

    rows.push({
      criterion,
      baselineValue: bVal,
      compareValue: cVal,
      threshold,
      operator,
      deltaAbs,
      deltaPct,
      trend,
      baselinePassed: base?.passed ?? null,
      comparePassed: comp?.passed ?? null,
    });
  }

  // Sort: regressions first, then improvements, then same/unknown
  const order: Record<string, number> = { worse: 0, better: 1, same: 2, unknown: 3 };
  return rows.sort((a, b) => order[a.trend] - order[b.trend]);
}

// ─── Trend icon ─────────────────────────────────────────────

function TrendIcon({ trend }: { trend: ComparisonRow['trend'] }) {
  switch (trend) {
    case 'better':
      return <TrendingUp size={12} className="text-green-600" />;
    case 'worse':
      return <TrendingDown size={12} className="text-red-500" />;
    case 'same':
      return <Minus size={12} className="text-content-muted" />;
    default:
      return <span className="text-[10px] text-content-muted">—</span>;
  }
}

const trendColorClass: Record<string, string> = {
  better: 'text-green-600',
  worse: 'text-red-500',
  same: 'text-content-muted',
  unknown: 'text-content-muted',
};

// ─── Format helpers ─────────────────────────────────────────

function fmtVal(v: number | null): string {
  if (v == null) return '—';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function fmtDelta(abs: number | null, pct: number | null): string {
  if (abs == null) return '—';
  const sign = abs >= 0 ? '+' : '';
  const absFmt = Number.isInteger(abs) ? String(abs) : abs.toFixed(2);
  const pctFmt = pct != null ? ` (${sign}${pct.toFixed(1)}%)` : '';
  return `${sign}${absFmt}${pctFmt}`;
}

function fmtDuration(ms?: number): string {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Main component ─────────────────────────────────────────

const EvidenceComparisonPanel: React.FC<EvidenceComparisonPanelProps> = ({
  cardId,
  baselineRun,
  compareRun,
  onClose,
}) => {
  const { data: baseEvidence, isLoading: baseLoading } = useCardEvidence(cardId, {
    run_id: baselineRun.id,
  });
  const { data: compEvidence, isLoading: compLoading } = useCardEvidence(cardId, {
    run_id: compareRun.id,
  });

  const isLoading = baseLoading || compLoading;
  const rows = !isLoading && baseEvidence && compEvidence
    ? buildComparisonRows(baseEvidence, compEvidence)
    : [];

  // Counts
  const improved = rows.filter((r) => r.trend === 'better').length;
  const regressed = rows.filter((r) => r.trend === 'worse').length;

  // Duration comparison
  const baseDur = baselineRun.duration_ms;
  const compDur = compareRun.duration_ms;
  const durDelta = baseDur && compDur ? ((compDur - baseDur) / baseDur) * 100 : null;

  return (
    <div className="border border-surface-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-bg">
        <h3 className="text-sm font-semibold text-content-primary">
          Evidence Comparison
        </h3>
        <button
          onClick={onClose}
          className="text-content-muted hover:text-content-primary text-xs"
        >
          Close
        </button>
      </div>

      {/* Run summary */}
      <div className="px-4 py-2 flex items-center gap-3 text-[11px] border-b border-surface-border">
        <div>
          <span className="text-content-muted">Baseline:</span>{' '}
          <span className="studio-mono text-content-primary">
            {baselineRun.id.slice(0, 8)}
          </span>
          <span className="text-content-tertiary ml-1">
            ({fmtDuration(baselineRun.duration_ms)})
          </span>
        </div>
        <ArrowRight size={12} className="text-content-muted" />
        <div>
          <span className="text-content-muted">Compare:</span>{' '}
          <span className="studio-mono text-content-primary">
            {compareRun.id.slice(0, 8)}
          </span>
          <span className="text-content-tertiary ml-1">
            ({fmtDuration(compareRun.duration_ms)})
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-content-tertiary py-4">
            No evidence available for comparison.
          </p>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex items-center gap-2 mb-3">
              {improved > 0 && (
                <Badge variant="success" className="text-[10px]">
                  {improved} improved
                </Badge>
              )}
              {regressed > 0 && (
                <Badge variant="danger" className="text-[10px]">
                  {regressed} regressed
                </Badge>
              )}
              <span className="text-[10px] text-content-muted">
                {rows.length} metrics compared
              </span>
            </div>

            {/* Comparison table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-content-muted border-b border-surface-border">
                  <th className="text-left px-2 py-1.5 font-medium">Metric</th>
                  <th className="text-right px-2 py-1.5 font-medium">Baseline</th>
                  <th className="text-right px-2 py-1.5 font-medium">Current</th>
                  <th className="text-right px-2 py-1.5 font-medium">Delta</th>
                  <th className="text-center px-2 py-1.5 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {rows.map((row) => (
                  <tr
                    key={row.criterion}
                    className={row.trend === 'worse' ? 'bg-red-50/30' : ''}
                  >
                    <td className="px-2 py-1.5 text-content-primary font-medium">
                      {row.criterion}
                    </td>
                    <td className="px-2 py-1.5 text-right studio-mono">
                      {fmtVal(row.baselineValue)}
                    </td>
                    <td className="px-2 py-1.5 text-right studio-mono">
                      {fmtVal(row.compareValue)}
                    </td>
                    <td className={`px-2 py-1.5 text-right studio-mono ${trendColorClass[row.trend]}`}>
                      {fmtDelta(row.deltaAbs, row.deltaPct)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon trend={row.trend} />
                        <span className={`text-[10px] ${trendColorClass[row.trend]}`}>
                          {row.trend}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Duration comparison */}
            {baseDur && compDur && (
              <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-4 text-[11px] text-content-tertiary">
                <span>
                  Duration: {fmtDuration(baseDur)} → {fmtDuration(compDur)}
                  {durDelta != null && (
                    <span className={durDelta < 0 ? 'text-green-600 ml-1' : 'text-red-500 ml-1'}>
                      ({durDelta >= 0 ? '+' : ''}{durDelta.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

EvidenceComparisonPanel.displayName = 'EvidenceComparisonPanel';

export default EvidenceComparisonPanel;
