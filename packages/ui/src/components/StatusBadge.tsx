import React from 'react';
import Badge, { type BadgeVariant, type BadgeStyle } from './Badge';

export type RunStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type NodeRunStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped'
  | 'waiting';

export type GateStatus = 'pending' | 'approved' | 'rejected' | 'expired';

type StatusType = RunStatus | NodeRunStatus | GateStatus;

interface StatusConfig {
  variant: BadgeVariant;
  label: string;
}

const statusMap: Record<string, StatusConfig> = {
  // RunStatus
  pending: { variant: 'neutral', label: 'Pending' },
  queued: { variant: 'info', label: 'Queued' },
  running: { variant: 'info', label: 'Running' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'danger', label: 'Failed' },
  cancelled: { variant: 'neutral', label: 'Cancelled' },
  paused: { variant: 'warning', label: 'Paused' },
  // NodeRunStatus
  idle: { variant: 'neutral', label: 'Idle' },
  success: { variant: 'success', label: 'Success' },
  error: { variant: 'danger', label: 'Error' },
  skipped: { variant: 'neutral', label: 'Skipped' },
  waiting: { variant: 'warning', label: 'Waiting' },
  // GateStatus
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  expired: { variant: 'warning', label: 'Expired' },
};

export interface StatusBadgeProps {
  status: StatusType;
  badgeStyle?: BadgeStyle;
  dot?: boolean;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  badgeStyle = 'filled',
  dot = true,
  className,
}) => {
  const config = statusMap[status] ?? { variant: 'neutral' as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} badgeStyle={badgeStyle} dot={dot} className={className}>
      {config.label}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
