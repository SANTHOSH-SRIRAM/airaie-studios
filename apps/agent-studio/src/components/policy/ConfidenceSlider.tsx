import React from 'react';
import { cn } from '@airaie/ui';

export interface ConfidenceSliderProps {
  threshold: number;
  className?: string;
}

const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({ threshold, className }) => {
  const pct = Math.min(Math.max(threshold, 0), 1) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-content-secondary">0</span>
        <span className="text-sm font-medium text-content-primary tabular-nums">
          {threshold.toFixed(2)}
        </span>
        <span className="text-xs text-content-secondary">1</span>
      </div>
      <div className="relative h-2 w-full bg-slate-100">
        <div
          className="h-full bg-brand-secondary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-content-muted">
        <span>Auto-approve</span>
        <span>Requires review</span>
      </div>
    </div>
  );
};

ConfidenceSlider.displayName = 'ConfidenceSlider';

export default ConfidenceSlider;
