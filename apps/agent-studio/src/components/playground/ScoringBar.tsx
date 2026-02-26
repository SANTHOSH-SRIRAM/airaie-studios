import React from 'react';
import { cn } from '@airaie/ui';

export interface ScoringBarProps {
  label: string;
  value: number;
  max?: number;
}

const ScoringBar: React.FC<ScoringBarProps> = ({ label, value, max = 1 }) => {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-content-secondary capitalize">{label}</span>
        <span className="text-xs text-content-muted tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 bg-slate-100 w-full">
        <div className="h-full bg-brand-secondary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

ScoringBar.displayName = 'ScoringBar';

export default ScoringBar;
