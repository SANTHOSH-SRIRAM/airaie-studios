// ============================================================
// ModeSelector — explore / study / release cards for creation wizard
// ============================================================

import React from 'react';
import { Compass, BookOpen, Rocket } from 'lucide-react';
import { cn } from '@airaie/ui';
import type { LucideIcon } from 'lucide-react';
import type { BoardMode } from '@/types/board';

export interface ModeSelectorProps {
  value: BoardMode | undefined;
  onChange: (mode: BoardMode) => void;
}

interface ModeOption {
  mode: BoardMode;
  label: string;
  icon: LucideIcon;
  description: string;
  gates: string;
}

const modeOptions: ModeOption[] = [
  {
    mode: 'explore',
    label: 'Explore',
    icon: Compass,
    description: 'Lightweight experimentation with no governance gates. Fast iteration and discovery.',
    gates: '0 gates',
  },
  {
    mode: 'study',
    label: 'Study',
    icon: BookOpen,
    description: 'Structured analysis with moderate governance. Review gates for validation rigor.',
    gates: '3 gates',
  },
  {
    mode: 'release',
    label: 'Release',
    icon: Rocket,
    description: 'Full compliance governance for production readiness. All gates required.',
    gates: '6 gates',
  },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {modeOptions.map(({ mode, label, icon: Icon, description, gates }) => {
        const selected = value === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              'flex flex-col items-start gap-3 p-4 text-left border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-1',
              selected
                ? 'border-brand-secondary bg-blue-50'
                : 'border-surface-border bg-white hover:bg-surface-hover'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon
                size={20}
                className={selected ? 'text-brand-secondary' : 'text-content-muted'}
              />
              <span className={cn('text-sm font-semibold', selected ? 'text-brand-secondary' : 'text-content-primary')}>
                {label}
              </span>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed">{description}</p>

            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5',
                selected ? 'bg-blue-100 text-brand-secondary' : 'bg-slate-100 text-content-muted'
              )}
            >
              {gates}
            </span>
          </button>
        );
      })}
    </div>
  );
};

ModeSelector.displayName = 'ModeSelector';

export default ModeSelector;
