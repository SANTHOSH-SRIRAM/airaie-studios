// ============================================================
// ReadinessBar — color-coded progress bar (red -> yellow -> green)
// ============================================================

import React from 'react';
import { cn } from '@airaie/ui';

export interface ReadinessBarProps {
  /** Readiness value from 0 to 1 */
  readiness: number;
  className?: string;
}

function getReadinessColor(value: number): string {
  if (value < 0.3) return 'bg-red-500';
  if (value < 0.7) return 'bg-amber-500';
  return 'bg-green-500';
}

const ReadinessBar: React.FC<ReadinessBarProps> = ({ readiness, className }) => {
  const clamped = Math.min(1, Math.max(0, readiness));
  const pct = Math.round(clamped * 100);

  return (
    <div
      className={cn('w-full h-1 bg-slate-100 rounded-sm overflow-hidden', className)}
      title={`${pct}% ready`}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-out rounded-sm', getReadinessColor(clamped))}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

ReadinessBar.displayName = 'ReadinessBar';

export default ReadinessBar;
