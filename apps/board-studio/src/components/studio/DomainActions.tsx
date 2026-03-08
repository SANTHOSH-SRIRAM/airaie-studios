// ============================================================
// DomainActions — domain-specific action buttons from registry
// ============================================================

import React from 'react';
import { Button } from '@airaie/ui';
import type { CardActionDefinition } from '@/types/vertical-registry';
import type { Card } from '@/types/board';

interface DomainActionsProps {
  actions: CardActionDefinition[];
  card: Card;
  onAction: (actionId: string, cardId: string) => void;
}

const DomainActions: React.FC<DomainActionsProps> = ({ actions, card, onAction }) => {
  const visibleActions = actions.filter((action) => {
    if (!action.condition) return true;
    return action.condition({ status: card.status, config: card.config });
  });

  if (visibleActions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {visibleActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant === 'primary' ? 'primary' : action.variant === 'secondary' ? 'secondary' : action.variant === 'outline' ? 'outline' : 'ghost'}
          size="sm"
          icon={action.icon}
          className="w-full"
          onClick={() => onAction(action.id, card.id)}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

DomainActions.displayName = 'DomainActions';

export default DomainActions;
