import React from 'react';
import { cn, Badge } from '@airaie/ui';
import type { ProposedAction } from '@airaie/shared';
import ScoringBar from './ScoringBar';

export interface ProposalActionCardProps {
  action: ProposedAction;
}

const ProposalActionCard: React.FC<ProposalActionCardProps> = ({ action }) => {
  const perms = [
    action.permissions.read && 'R',
    action.permissions.write && 'W',
    action.permissions.execute && 'X',
  ]
    .filter(Boolean)
    .join('/');

  return (
    <div className="border border-surface-border bg-white p-3 space-y-2">
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono text-content-primary">{action.tool_ref}</code>
        <Badge variant="neutral" badgeStyle="outline">{perms}</Badge>
        {action.requires_approval && (
          <Badge variant="warning" badgeStyle="filled">Approval</Badge>
        )}
        <span className="ml-auto text-xs text-content-muted">#{action.order}</span>
      </div>

      <div className="space-y-1">
        <ScoringBar label="compatibility" value={action.scoring.compatibility} />
        <ScoringBar label="trust" value={action.scoring.trust} />
        <ScoringBar label="cost" value={action.scoring.cost} />
        <ScoringBar label="final" value={action.scoring.final_score} />
      </div>

      {action.justification && (
        <p className="text-xs text-content-secondary">{action.justification}</p>
      )}
    </div>
  );
};

ProposalActionCard.displayName = 'ProposalActionCard';

export default ProposalActionCard;
