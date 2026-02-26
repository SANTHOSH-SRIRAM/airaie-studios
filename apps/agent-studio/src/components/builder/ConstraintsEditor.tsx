import React from 'react';
import { cn, Input } from '@airaie/ui';
import { useSpecStore } from '@store/specStore';

interface ConstraintField {
  key: keyof ReturnType<typeof useSpecStore.getState>['constraints'];
  label: string;
  min: number;
  max: number;
  step: number;
}

const fields: ConstraintField[] = [
  { key: 'max_tools_per_run', label: 'Max Tools per Run', min: 1, max: 100, step: 1 },
  { key: 'timeout_seconds', label: 'Timeout (seconds)', min: 1, max: 604800, step: 1 },
  { key: 'max_retries', label: 'Max Retries', min: 0, max: 10, step: 1 },
  { key: 'budget_limit', label: 'Budget Limit ($)', min: 0, max: 10000, step: 0.1 },
];

const ConstraintsEditor: React.FC<{ className?: string }> = ({ className }) => {
  const constraints = useSpecStore((s) => s.constraints);
  const setConstraints = useSpecStore((s) => s.setConstraints);

  const handleChange = (key: ConstraintField['key'], value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setConstraints({ ...constraints, [key]: num });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <label className="text-sm font-medium text-content-primary block">Constraints</label>

      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <Input
            key={field.key}
            label={field.label}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={constraints[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
};

ConstraintsEditor.displayName = 'ConstraintsEditor';

export default ConstraintsEditor;
