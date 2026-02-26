import React from 'react';
import { cn, Badge } from '@airaie/ui';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { KernelGateApproval } from '@airaie/shared';

export interface ApprovalHistoryItemProps {
  approval: KernelGateApproval;
  className?: string;
}

const actionIcon: Record<string, React.ElementType> = {
  approve: Check,
  reject: X,
  waive: AlertTriangle,
};

const actionVariant: Record<string, 'success' | 'danger' | 'warning'> = {
  approve: 'success',
  reject: 'danger',
  waive: 'warning',
};

const ApprovalHistoryItem: React.FC<ApprovalHistoryItemProps> = ({ approval, className }) => {
  const Icon = actionIcon[approval.action] || Check;
  const variant = actionVariant[approval.action] || 'neutral';

  return (
    <div className={cn('flex items-start gap-3 px-3 py-2 border border-surface-border bg-white', className)}>
      <Icon size={16} className={`text-status-${variant === 'success' ? 'success' : variant === 'danger' ? 'danger' : 'warning'} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-content-primary">{approval.actor}</span>
          <Badge variant={variant} badgeStyle="outline">{approval.action}</Badge>
          {approval.role && <span className="text-xs text-content-muted">{approval.role}</span>}
        </div>
        {approval.rationale && <p className="text-xs text-content-secondary mt-1">{approval.rationale}</p>}
      </div>
    </div>
  );
};

ApprovalHistoryItem.displayName = 'ApprovalHistoryItem';
export default ApprovalHistoryItem;
