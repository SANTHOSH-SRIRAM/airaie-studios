// ============================================================
// EvidenceSparkline — SVG mini sparkline chart
// ============================================================

import React from 'react';

export interface EvidenceSparklineProps {
  values: number[];
  threshold?: number;
  operator?: 'lt' | 'lte' | 'gt' | 'gte';
  label?: string;
  width?: number;
  height?: number;
}

function getLineColor(latest: number, threshold: number | undefined, operator: string | undefined): string {
  if (threshold == null || !operator) return '#3b82f6';
  const passes =
    operator === 'gte' ? latest >= threshold :
    operator === 'gt' ? latest > threshold :
    operator === 'lte' ? latest <= threshold :
    operator === 'lt' ? latest < threshold : true;
  return passes ? '#22c55e' : '#ef4444';
}

const EvidenceSparkline: React.FC<EvidenceSparklineProps> = ({
  values,
  threshold,
  operator,
  label,
  width = 80,
  height = 24,
}) => {
  if (values.length === 0) {
    return <span className="text-[10px] text-content-muted">—</span>;
  }

  if (values.length === 1) {
    return (
      <span className="text-[10px] text-content-primary studio-mono">
        {values[0].toFixed(2)}
      </span>
    );
  }

  const pts = values.slice(-50); // limit to last 50
  const dataMin = Math.min(...pts, threshold ?? Infinity);
  const dataMax = Math.max(...pts, threshold ?? -Infinity);
  const range = dataMax - dataMin || 1;
  const pad = 2;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const points = pts.map((v, i) => {
    const x = pad + (i / (pts.length - 1)) * innerW;
    const y = pad + innerH - ((v - dataMin) / range) * innerH;
    return `${x},${y}`;
  });

  const lineColor = getLineColor(pts[pts.length - 1], threshold, operator);

  // Fill polygon (area under line)
  const fillPoints = [
    `${pad},${pad + innerH}`,
    ...points,
    `${pad + innerW},${pad + innerH}`,
  ].join(' ');

  // Threshold line
  const threshY = threshold != null ? pad + innerH - ((threshold - dataMin) / range) * innerH : null;

  // Trend arrow
  const latest = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const trend = latest > prev ? '↑' : latest < prev ? '↓' : '→';

  const ariaText = `${label ?? 'Sparkline'}: ${pts.length} points, latest ${latest.toFixed(2)}, trend ${trend}`;

  return (
    <div className="inline-flex items-center gap-1" aria-label={ariaText} role="img">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Fill area */}
        <polygon points={fillPoints} fill={lineColor} opacity={0.1} />

        {/* Threshold dashed line */}
        {threshY != null && (
          <line
            x1={pad} y1={threshY} x2={width - pad} y2={threshY}
            stroke="#94a3b8" strokeWidth={0.75} strokeDasharray="3,2"
          />
        )}

        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-[9px] ${
        trend === '↑' ? 'text-green-600' : trend === '↓' ? 'text-red-500' : 'text-content-muted'
      }`}>
        {trend}
      </span>
    </div>
  );
};

EvidenceSparkline.displayName = 'EvidenceSparkline';

export default EvidenceSparkline;
