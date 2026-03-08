// ============================================================
// KPIDashboard — per-card KPI visualization with thresholds
// ============================================================

import React from 'react';

interface KPIEntry {
  value: number;
  threshold?: number;
  operator?: string;
}

interface KPIDashboardProps {
  kpis: Record<string, unknown>;
}

function isKPIEntry(val: unknown): val is KPIEntry {
  return typeof val === 'object' && val !== null && 'value' in val;
}

function evaluateKPI(entry: KPIEntry): 'pass' | 'fail' | 'unknown' {
  if (entry.threshold == null || entry.operator == null) return 'unknown';
  const { value, threshold, operator } = entry;
  switch (operator) {
    case '<': return value < threshold ? 'pass' : 'fail';
    case '<=': return value <= threshold ? 'pass' : 'fail';
    case '>': return value > threshold ? 'pass' : 'fail';
    case '>=': return value >= threshold ? 'pass' : 'fail';
    case '==': return value === threshold ? 'pass' : 'fail';
    default: return 'unknown';
  }
}

function progressPercent(entry: KPIEntry): number {
  if (entry.threshold == null || entry.threshold === 0) return 0;
  return Math.min(100, Math.round((entry.value / entry.threshold) * 100));
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ kpis }) => {
  const entries = Object.entries(kpis);

  if (entries.length === 0) {
    return <span className="text-xs text-content-muted">No KPIs defined</span>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([key, val]) => {
        if (isKPIEntry(val)) {
          const status = evaluateKPI(val);
          const pct = progressPercent(val);
          const barColor =
            status === 'pass' ? 'bg-green-500' :
            status === 'fail' ? 'bg-red-500' : 'bg-slate-400';

          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-content-secondary">{key}</span>
                <span className="text-[10px] studio-mono text-content-muted">
                  {val.value}
                  {val.threshold != null && (
                    <> {val.operator ?? '?'} {val.threshold}</>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-surface-bg border border-surface-border rounded-sm overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        }

        // Flat scalar value (legacy)
        return (
          <div key={key} className="flex justify-between items-center">
            <span className="text-xs text-content-secondary">{key}</span>
            <span className="text-xs font-medium text-content-primary studio-mono">
              {String(val)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

KPIDashboard.displayName = 'KPIDashboard';

export default KPIDashboard;
