// ============================================================
// CardStatusBadge — reusable badge for all 8 kernel card statuses
// ============================================================

import React from 'react';
import {
  Circle,
  Zap,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  SkipForward,
} from 'lucide-react';
import type { CardStatus } from '@/types/board';

const statusConfig: Record<CardStatus, {
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  className: string;
  animate?: boolean;
}> = {
  draft: {
    icon: Circle,
    label: 'Draft',
    className: 'border-slate-300 text-slate-500 bg-slate-50',
  },
  ready: {
    icon: Zap,
    label: 'Ready',
    className: 'border-blue-400 text-blue-700 bg-blue-50',
  },
  queued: {
    icon: Clock,
    label: 'Queued',
    className: 'border-amber-400 text-amber-700 bg-amber-50',
    animate: true,
  },
  running: {
    icon: Loader2,
    label: 'Running',
    className: 'border-blue-400 text-blue-700 bg-blue-50',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'border-green-400 text-green-700 bg-green-50',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'border-red-400 text-red-700 bg-red-50',
  },
  blocked: {
    icon: Lock,
    label: 'Blocked',
    className: 'border-amber-400 text-amber-700 bg-amber-50',
  },
  skipped: {
    icon: SkipForward,
    label: 'Skipped',
    className: 'border-slate-300 text-slate-500 bg-slate-50',
  },
};

interface CardStatusBadgeProps {
  status: CardStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const CardStatusBadge: React.FC<CardStatusBadgeProps> = ({
  status,
  size = 'sm',
  showLabel = true,
}) => {
  const config = statusConfig[status] ?? statusConfig.draft;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 10 : 12;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 border rounded-sm
        ${textSize} font-medium ${config.className}
      `}
    >
      <Icon
        size={iconSize}
        className={config.animate ? 'animate-spin' : ''}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};

CardStatusBadge.displayName = 'CardStatusBadge';

export default CardStatusBadge;
