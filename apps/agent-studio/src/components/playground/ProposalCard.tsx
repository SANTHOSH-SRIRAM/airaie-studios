import React from 'react';
import { cn, Button, Badge } from '@airaie/ui';
import { Check, X } from 'lucide-react';
import type { ActionProposal } from '@airaie/shared';
import { formatCost } from '@airaie/ui';

export interface ProposalCardProps {
  proposal: ActionProposal;
  onApprove: () => void;
  onReject: () => void;
  onSelect: () => void;
  isSelected?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onApprove, onReject, onSelect, isSelected }) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'mx-auto max-w-[85%] border bg-white px-4 py-3 space-y-2 cursor-pointer transition-colors',
        isSelected ? 'border-brand-secondary shadow-md' : 'border-surface-border hover:border-blue-300'
      )}
    >
      <div className="flex items-center gap-2">
        <Badge variant="info" badgeStyle="outline">Proposal</Badge>
        <span className="text-xs text-content-muted">Score: {proposal.total_score.toFixed(2)}</span>
        <span className="text-xs text-content-muted">{formatCost(proposal.estimated_cost)}</span>
        <span className="text-xs text-content-muted ml-auto">{proposal.actions.length} action{proposal.actions.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-sm text-content-secondary truncate">{proposal.goal}</p>
      {proposal.status === 'draft' && (
        <div className="flex items-center gap-2 pt-1">
          <Button variant="primary" size="sm" icon={Check} onClick={(e) => { e.stopPropagation(); onApprove(); }}>
            Approve
          </Button>
          <Button variant="outline" size="sm" icon={X} onClick={(e) => { e.stopPropagation(); onReject(); }}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

ProposalCard.displayName = 'ProposalCard';

export default ProposalCard;
