// ============================================================
// EvidenceGauge — SVG circular gauge with threshold zones
// ============================================================

import React from 'react';

export interface EvidenceGaugeProps {
  value: number;
  min: number;
  max: number;
  threshold?: number;
  operator?: 'lt' | 'lte' | 'gt' | 'gte';
  unit?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 32, md: 48, lg: 64 };
const SWEEP = 240; // degrees
const START_ANGLE = 150; // start from bottom-left

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function getColor(value: number, threshold: number | undefined, operator: string | undefined): string {
  if (threshold == null || !operator) return '#3b82f6'; // blue default
  const passes =
    operator === 'gte' ? value >= threshold :
    operator === 'gt' ? value > threshold :
    operator === 'lte' ? value <= threshold :
    operator === 'lt' ? value < threshold : true;

  if (!passes) return '#ef4444'; // red
  // Check margin
  const range = Math.abs(threshold);
  if (range === 0) return '#22c55e';
  const margin = Math.abs(value - threshold) / range;
  if (margin < 0.1) return '#f59e0b'; // amber - tight
  return '#22c55e'; // green
}

const EvidenceGauge: React.FC<EvidenceGaugeProps> = ({
  value,
  min,
  max,
  threshold,
  operator,
  unit,
  label,
  size = 'md',
}) => {
  const dim = sizes[size];
  const cx = dim / 2;
  const cy = dim / 2;
  const r = dim / 2 - 4;
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;

  const clamped = Math.max(min, Math.min(max, value));
  const fraction = max !== min ? (clamped - min) / (max - min) : 0;
  const valueAngle = START_ANGLE + fraction * SWEEP;
  const color = getColor(value, threshold, operator);

  // Threshold tick
  let thresholdAngle: number | null = null;
  if (threshold != null && threshold >= min && threshold <= max && max !== min) {
    thresholdAngle = START_ANGLE + ((threshold - min) / (max - min)) * SWEEP;
  }

  const bgPath = arcPath(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP);
  const valuePath = fraction > 0.001 ? arcPath(cx, cy, r, START_ANGLE, valueAngle) : '';

  const fontSize = size === 'sm' ? 8 : size === 'md' ? 10 : 13;
  const unitSize = size === 'sm' ? 5 : size === 'md' ? 7 : 9;

  const ariaText = `${label ?? 'Metric'}: ${value}${unit ? ' ' + unit : ''}${
    threshold != null && operator ? `, target ${operator === 'gte' ? '≥' : operator === 'gt' ? '>' : operator === 'lte' ? '≤' : '<'} ${threshold}` : ''
  }`;

  return (
    <div className="inline-flex flex-col items-center" style={{ width: dim }}>
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-label={ariaText}
        role="img"
      >
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* Value arc */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}

        {/* Threshold tick */}
        {thresholdAngle != null && (() => {
          const inner = polarToCartesian(cx, cy, r - strokeWidth, thresholdAngle);
          const outer = polarToCartesian(cx, cy, r + strokeWidth, thresholdAngle);
          return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#64748b" strokeWidth={1.5} />;
        })()}

        {/* Center value */}
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" className="font-semibold" style={{ fontSize, fill: '#1e293b' }}>
          {Number.isInteger(value) ? value : value.toFixed(2)}
        </text>
        {unit && size !== 'sm' && (
          <text x={cx} y={cy + fontSize - 1} textAnchor="middle" style={{ fontSize: unitSize, fill: '#94a3b8' }}>
            {unit}
          </text>
        )}
      </svg>
      {label && size !== 'sm' && (
        <span className="text-[9px] text-content-muted mt-0.5 text-center leading-tight truncate w-full">
          {label}
        </span>
      )}
    </div>
  );
};

EvidenceGauge.displayName = 'EvidenceGauge';

export default EvidenceGauge;
