// ============================================================
// ActionProposalNode — Custom ReactFlow node for agent proposal DAG
// Shows confidence score, approval status, and approve/reject controls
// ============================================================

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge, Button } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { Check, X, Zap } from 'lucide-react';
import type { ProposalAction } from '@/types/governance';

export interface ActionProposalNodeData {
  action: ProposalAction;
  onApprove: (actionId: string) => void;
  onReject: (actionId: string) => void;
  [key: string]: unknown;
}

const approvalBadgeVariants: Record<string, BadgeVariant> = {
  approved: 'success',
  'auto-approved': 'success',
  rejected: 'danger',
  pending: 'neutral',
};

const approvalBorderClasses: Record<string, string> = {
  approved: 'border-green-500 bg-green-50',
  'auto-approved': 'border-green-500 bg-green-50',
  rejected: 'border-red-500 bg-red-50',
  pending: 'border-slate-200 bg-slate-50',
};

function ActionProposalNodeInner({ data }: { data: ActionProposalNodeData }) {
  const { action, onApprove, onReject } = data;
  const approval = action.approval ?? 'pending';
  const borderClass = approvalBorderClasses[approval] ?? approvalBorderClasses.pending;
  const isAutoApproved = approval === 'auto-approved';
  const isPending = approval === 'pending';
  const confidencePct = Math.round(action.confidence * 100);

  return (
    <div
      className={`border-2 rounded px-3 py-2 min-w-[170px] max-w-[220px] ${borderClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />

      {/* Tool name */}
      <div className="font-medium text-xs text-content-primary truncate">
        {action.tool_name}
      </div>

      {/* Confidence score */}
      <div className="text-[10px] text-content-muted mt-0.5">
        {confidencePct}% conf
      </div>

      {/* Status badge */}
      <div className="mt-1.5 flex items-center gap-1">
        {isAutoApproved && <Zap size={12} className="text-amber-500" />}
        <Badge
          variant={approvalBadgeVariants[approval] ?? 'neutral'}
          dot
          className="text-[10px]"
        >
          {isAutoApproved ? 'Auto-approved' : approval}
        </Badge>
      </div>

      {/* Approve / Reject buttons for pending actions */}
      {isPending && (
        <div className="mt-1.5 flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            icon={Check}
            className="!h-6 !px-1.5 !text-green-600 hover:!bg-green-100"
            onClick={() => onApprove(action.id)}
            aria-label={`Approve ${action.tool_name}`}
          />
          <Button
            size="sm"
            variant="secondary"
            icon={X}
            className="!h-6 !px-1.5 !text-red-600 hover:!bg-red-100"
            onClick={() => onReject(action.id)}
            aria-label={`Reject ${action.tool_name}`}
          />
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
    </div>
  );
}

const ActionProposalNode = memo(ActionProposalNodeInner);
ActionProposalNode.displayName = 'ActionProposalNode';

export default ActionProposalNode;
