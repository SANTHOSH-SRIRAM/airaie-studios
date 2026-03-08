// ============================================================
// EvidenceBar — horizontal bar with threshold marker
// ============================================================

import React from 'react';

export interface EvidenceBarProps {
  value: number;
  min: number;
  max: number;
  threshold?: number;
  operator?: 'lt' | 'lte' | 'gt' | 'gte';
  unit?: string;
  label?: string;
  compact?: boolean;
}

function getBarColor(value: number, threshold: number | undefined, operator: string | undefined): string {
  if (threshold == null || !operator) return 'bg-blue-500';
  const passes =
    operator === 'gte' ? value >= threshold :
    operator === 'gt' ? value > threshold :
    operator === 'lte' ? value <= threshold :
    operator === 'lt' ? value < threshold : true;

  if (!passes) return 'bg-red-500';
  const range = Math.abs(threshold);
  if (range > 0 && Math.abs(value - threshold) / range < 0.1) return 'bg-amber-400';
  return 'bg-green-500';
}

const EvidenceBar: React.FC<EvidenceBarProps> = ({
  value,
  min,
  max,
  threshold,
  operator,
  unit,
  label,
  compact = false,
}) => {
  const range = max - min;
  const fraction = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0;
  const thresholdFraction = threshold != null && range > 0
    ? Math.max(0, Math.min(1, (threshold - min) / range))
    : null;

  const barColor = getBarColor(value, threshold, operator);
  const barHeight = compact ? 'h-1' : 'h-2.5';

  const ariaText = `${label ?? 'Metric'}: ${value}${unit ? ' ' + unit : ''}${
    threshold != null && operator ? `, threshold ${operator} ${threshold}` : ''
  }`;

  return (
    <div aria-label={ariaText} role="img">
      {!compact && (
        <div className="flex items-center justify-between mb-0.5">
          {label && <span className="text-[10px] text-content-muted">{label}</span>}
          <span className="text-[10px] text-content-primary studio-mono">
            {Number.isInteger(value) ? value : value.toFixed(2)}{unit ? ` ${unit}` : ''}
          </span>
        </div>
      )}
      <div className={`relative ${barHeight} bg-surface-bg border border-surface-border overflow-hidden`}>
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${fraction * 100}%` }} />
        {thresholdFraction != null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-600"
            style={{ left: `${thresholdFraction * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};

EvidenceBar.displayName = 'EvidenceBar';

export default EvidenceBar;
