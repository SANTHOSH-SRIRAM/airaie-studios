// ============================================================
// CardComponent — individual card display for Kanban and graph views
// ============================================================

import React from 'react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Card, CardType, CardStatus } from '@/types/board';

export interface CardComponentProps {
  card: Card;
  onClick?: (card: Card) => void;
  compact?: boolean;
}

const cardTypeVariants: Record<CardType, BadgeVariant> = {
  simulation: 'info',
  optimization: 'info',
  validation: 'success',
  manufacturing: 'warning',
  analysis: 'neutral',
  custom: 'neutral',
  research: 'neutral',
};

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
  waived: 'warning',
  cancelled: 'neutral',
};

const CardComponent: React.FC<CardComponentProps> = ({ card, onClick, compact }) => {
  const kpiEntries = Object.entries(card.kpis ?? {});
  const depCount = card.dependencies?.length ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(card);
        }
      }}
      className={`
        bg-white border border-surface-border p-3 cursor-pointer
        hover:shadow-card-hover transition-shadow duration-150
        ${compact ? 'space-y-1' : 'space-y-2'}
      `}
    >
      {/* Card name */}
      <div className="font-medium text-sm text-content-primary truncate">
        {card.name || card.title}
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={cardTypeVariants[card.type]} className="text-[10px]">
          {card.type}
        </Badge>
        <Badge variant={cardStatusVariants[card.status]} dot className="text-[10px]">
          {card.status}
        </Badge>
      </div>

      {/* KPI summary (if available and not compact) */}
      {!compact && kpiEntries.length > 0 && (
        <div className="text-xs text-content-tertiary truncate">
          {kpiEntries
            .slice(0, 2)
            .map(([key, val]) => `${key}: ${val}`)
            .join(' | ')}
        </div>
      )}

      {/* Dependency count */}
      {depCount > 0 && (
        <div className="text-xs text-content-muted">
          {depCount} dep{depCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

CardComponent.displayName = 'CardComponent';

export default CardComponent;
