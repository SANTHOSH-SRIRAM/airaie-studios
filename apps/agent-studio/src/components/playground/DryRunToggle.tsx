import React from 'react';
import { cn } from '@airaie/ui';
import { usePlaygroundStore } from '@store/playgroundStore';

const DryRunToggle: React.FC<{ className?: string }> = ({ className }) => {
  const dryRun = usePlaygroundStore((s) => s.dryRun);
  const setDryRun = usePlaygroundStore((s) => s.setDryRun);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setDryRun(!dryRun);
    }
  };

  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', className)}>
      <div
        role="switch"
        aria-checked={dryRun}
        aria-label="Dry run mode"
        tabIndex={0}
        className={cn(
          'relative w-9 h-5 transition-colors',
          dryRun ? 'bg-brand-secondary' : 'bg-slate-300'
        )}
        onClick={() => setDryRun(!dryRun)}
        onKeyDown={handleKeyDown}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white shadow transition-transform',
            dryRun ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
      <span className="text-sm text-content-secondary">Dry Run</span>
    </label>
  );
};

DryRunToggle.displayName = 'DryRunToggle';

export default DryRunToggle;
