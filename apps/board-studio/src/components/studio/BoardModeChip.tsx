// ============================================================
// BoardModeChip — color-coded board mode indicator with tooltip
// ============================================================

import React from 'react';
import { Compass, Microscope, Rocket, Lock } from 'lucide-react';
import type { BoardMode } from '@/types/board';

interface BoardModeChipProps {
  mode: BoardMode;
  className?: string;
}

const modeConfig: Record<
  BoardMode,
  {
    icon: React.ElementType;
    label: string;
    tooltip: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  explore: {
    icon: Compass,
    label: 'Explore',
    tooltip: 'Exploration mode - All tools available, auto-approval enabled',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
    borderClass: 'border-green-300',
  },
  study: {
    icon: Microscope,
    label: 'Study',
    tooltip: 'Study mode - Verified tools only, gate evaluation required',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
  },
  release: {
    icon: Rocket,
    label: 'Release',
    tooltip:
      'Release mode - Certified tools only, manual approval required for all actions',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-300',
  },
};

export default function BoardModeChip({ mode, className = '' }: BoardModeChipProps) {
  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <span className={`group relative inline-flex items-center ${className}`}>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        <Icon size={11} aria-hidden="true" />
        {config.label}
        {mode === 'release' && <Lock size={11} aria-hidden="true" />}
      </span>

      {/* CSS-only tooltip */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 hidden group-hover:block w-56 rounded bg-gray-900 px-2.5 py-1.5 text-[11px] leading-tight text-white shadow-lg">
        {config.tooltip}
      </span>
    </span>
  );
}
