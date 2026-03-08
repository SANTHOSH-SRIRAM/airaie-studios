// ============================================================
// VerticalBadge — reusable vertical indicator chip
// ============================================================

import React from 'react';
import type { VerticalTheme } from '@/types/vertical-registry';

interface VerticalBadgeProps {
  theme: VerticalTheme;
  size?: 'sm' | 'md';
  className?: string;
}

const accentClasses: Record<string, { bg: string; text: string; border: string }> = {
  'blue-600': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'emerald-600': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'violet-600': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'amber-600': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const VerticalBadge: React.FC<VerticalBadgeProps> = ({ theme, size = 'sm', className = '' }) => {
  const Icon = theme.icon;
  const colors = accentClasses[theme.accentColor] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-1.5 py-0.5 gap-1'
    : 'text-xs px-2 py-1 gap-1.5';
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`
        inline-flex items-center border font-medium
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses} ${className}
      `}
      role="img"
      aria-label={`${theme.name} vertical`}
    >
      <Icon size={iconSize} aria-hidden="true" />
      <span>{theme.name}</span>
    </span>
  );
};

VerticalBadge.displayName = 'VerticalBadge';

export default VerticalBadge;
