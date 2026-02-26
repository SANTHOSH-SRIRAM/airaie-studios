import React from 'react';
import { cn, Select } from '@airaie/ui';
import type { ScoringStrategy } from '@airaie/shared';
import { useSpecStore } from '@store/specStore';

const strategyOptions = [
  { value: 'weighted', label: 'Weighted' },
  { value: 'priority', label: 'Priority' },
  { value: 'cost_optimized', label: 'Cost Optimized' },
];

const weightKeys = ['compatibility', 'trust', 'cost'] as const;

const ScoringEditor: React.FC<{ className?: string }> = ({ className }) => {
  const scoring = useSpecStore((s) => s.scoring);
  const setScoring = useSpecStore((s) => s.setScoring);

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScoring({ ...scoring, strategy: e.target.value as ScoringStrategy });
  };

  const handleWeightChange = (key: keyof typeof scoring.weights, value: number) => {
    setScoring({ ...scoring, weights: { ...scoring.weights, [key]: value } });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <label className="text-sm font-medium text-content-primary block">Scoring</label>

      <Select
        label="Strategy"
        options={strategyOptions}
        value={scoring.strategy}
        onChange={handleStrategyChange}
      />

      {scoring.strategy === 'weighted' && (
        <div className="space-y-3 pt-1">
          {weightKeys.map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm text-content-secondary capitalize">{key}</label>
                <span className="text-xs text-content-muted tabular-nums w-10 text-right">
                  {scoring.weights[key].toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={scoring.weights[key]}
                onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#3b5fa8] cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ScoringEditor.displayName = 'ScoringEditor';

export default ScoringEditor;
