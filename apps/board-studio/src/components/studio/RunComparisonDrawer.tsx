// ============================================================
// RunComparisonDrawer — Side-by-side KPI comparison for 2+ runs
// Renders as a fixed overlay drawer (right side, 480px, z-50)
// Supports table mode (default) and chart overlay mode
// ============================================================

import React, { useMemo, useState } from 'react';
import { X, ArrowUp, ArrowDown, BarChart2, Table2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from '@airaie/charts';
import type { Card } from '@/types/board';
import type { CardRun } from '@api/cards';
import type { KPIDelta } from '@/types/analytics';

// --- Color palette for bars ---
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// --- Props ---
export interface RunComparisonDrawerProps {
  open: boolean;
  onClose: () => void;
  runs: CardRun[];
  card: Card;
}

// --- KPI delta computation ---

function computeKPIDeltas(card: Card, runs: CardRun[]): KPIDelta[] {
  const kpiEntries = Object.entries(card.kpis ?? {});
  if (kpiEntries.length === 0) return [];

  return kpiEntries.map(([key, kpiDef]) => {
    // Extract target value from KPI definition
    const target = typeof kpiDef === 'object' && kpiDef !== null
      ? (kpiDef as Record<string, unknown>).value as number | undefined
      : typeof kpiDef === 'number'
        ? kpiDef
        : null;

    // For each run, use the target value (real per-run KPI values would come from run results)
    // In the current data model, card.kpis holds targets, not per-run actuals
    const values = runs.map(() => target ?? null);

    const numericValues = values.filter((v): v is number => v !== null);
    const first = numericValues[0] ?? 0;
    const last = numericValues[numericValues.length - 1] ?? 0;
    const delta = last - first;
    const deltaPercent = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;

    return {
      key,
      values,
      delta,
      deltaPercent,
      improved: delta >= 0, // higher is better by default
    };
  });
}

// --- Component ---

export default function RunComparisonDrawer({
  open,
  onClose,
  runs,
  card,
}: RunComparisonDrawerProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const kpiDeltas = useMemo(() => computeKPIDeltas(card, runs), [card, runs]);
  const capped = runs.slice(0, 5); // Max 5 runs

  if (!open) return null;

  const hasKPIs = kpiDeltas.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="comparison-backdrop"
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-white shadow-xl z-50 flex flex-col border-l border-surface-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-content-primary">Run Comparison</h2>
          <div className="flex items-center gap-2">
            {hasKPIs && viewMode === 'table' && (
              <button
                type="button"
                onClick={() => setViewMode('chart')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-content-muted hover:text-content-primary transition-colors rounded border border-surface-border"
                aria-label="Switch to chart view"
              >
                <BarChart2 size={12} />
                Chart
              </button>
            )}
            {hasKPIs && viewMode === 'chart' && (
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-content-muted hover:text-content-primary transition-colors rounded border border-surface-border"
                aria-label="Switch to table view"
              >
                <Table2 size={12} />
                Table
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-content-muted hover:text-content-primary transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!hasKPIs ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-content-tertiary">No KPI data available for comparison</p>
            </div>
          ) : viewMode === 'table' ? (
            <KPITable kpiDeltas={kpiDeltas} runs={capped} />
          ) : (
            <KPIChart kpiDeltas={kpiDeltas} runs={capped} />
          )}
        </div>
      </div>
    </>
  );
}

// --- Table sub-component ---

function KPITable({ kpiDeltas, runs }: { kpiDeltas: KPIDelta[]; runs: CardRun[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-content-tertiary border-b border-surface-border">
          <th className="text-left pb-2 font-medium">KPI</th>
          {runs.map((run) => (
            <th key={run.id} className="text-right pb-2 font-medium font-mono">
              {run.id.slice(0, 8)}
            </th>
          ))}
          {runs.length >= 2 && (
            <th className="text-right pb-2 font-medium">Delta</th>
          )}
        </tr>
      </thead>
      <tbody>
        {kpiDeltas.map((kpi) => (
          <tr key={kpi.key} className="border-b border-surface-border/50 last:border-0">
            <td className="py-2 text-content-primary font-medium">{kpi.key}</td>
            {kpi.values.map((val, idx) => (
              <td key={idx} className="py-2 text-right font-mono text-content-primary">
                {val !== null ? val.toFixed(2) : '--'}
              </td>
            ))}
            {runs.length >= 2 && (
              <td className="py-2 text-right">
                <span
                  className={`inline-flex items-center gap-0.5 font-mono ${
                    kpi.improved ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {kpi.improved ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                  {Math.abs(kpi.deltaPercent).toFixed(1)}%
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// --- Chart sub-component ---

function KPIChart({ kpiDeltas, runs }: { kpiDeltas: KPIDelta[]; runs: CardRun[] }) {
  const chartData = kpiDeltas.map((kpi) => {
    const point: Record<string, unknown> = { kpi: kpi.key };
    runs.forEach((run, idx) => {
      point[run.id.slice(0, 8)] = kpi.values[idx];
    });
    return point;
  });

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="kpi" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          {runs.map((run, idx) => (
            <Bar
              key={run.id}
              dataKey={run.id.slice(0, 8)}
              fill={BAR_COLORS[idx % BAR_COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
