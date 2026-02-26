import React from 'react';
import { cn } from '@airaie/ui';
import { useSpecStore } from '@store/specStore';

const MAX_CHARS = 4000;

const GoalEditor: React.FC<{ className?: string }> = ({ className }) => {
  const goal = useSpecStore((s) => s.goal);
  const setGoal = useSpecStore((s) => s.setGoal);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-content-primary">Agent Goal</label>
        <span
          className={cn(
            'text-xs tabular-nums',
            goal.length > MAX_CHARS * 0.9 ? 'text-status-danger' : 'text-content-muted'
          )}
        >
          {goal.length} / {MAX_CHARS}
        </span>
      </div>
      <textarea
        value={goal}
        onChange={(e) => {
          if (e.target.value.length <= MAX_CHARS) setGoal(e.target.value);
        }}
        placeholder="Describe the agent's primary objective..."
        rows={6}
        className={cn(
          'w-full px-3 py-2.5 text-sm bg-white border border-surface-border rounded-none resize-y',
          'text-content-primary placeholder:text-content-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-1',
          'leading-relaxed'
        )}
      />
    </div>
  );
};

GoalEditor.displayName = 'GoalEditor';

export default GoalEditor;
