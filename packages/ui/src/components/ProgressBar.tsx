import React from 'react';
import { cn } from '../utils/cn';

export interface ProgressBarProps {
  /** Percentage 0-100 */
  value: number;
  /** Enable striped/hatched pattern */
  striped?: boolean;
  /** Custom bar color (Tailwind bg class). Defaults to brand secondary blue. */
  color?: string;
  /** Optional label displayed above the bar */
  label?: string;
  /** Show percentage text */
  showPercent?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  striped = false,
  color = 'bg-brand-primary',
  label,
  showPercent = false,
  className,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs font-medium text-content-secondary">{label}</span>}
          {showPercent && (
            <span className="text-xs text-content-muted">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-none overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-none',
            color,
            striped && 'progress-striped'
          )}
          style={{
            width: `${clamped}%`,
            ...(striped
              ? {
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.2) 6px, rgba(255,255,255,0.2) 12px)',
                }
              : {}),
          }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
