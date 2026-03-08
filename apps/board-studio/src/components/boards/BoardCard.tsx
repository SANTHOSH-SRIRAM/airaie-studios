// ============================================================
// BoardCard — grid view card for a single board
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trash2 } from 'lucide-react';
import { Card, Badge, cn, formatRelativeTime } from '@airaie/ui';
import type { BadgeVariant, BadgeStyle } from '@airaie/ui';
import type { Board, BoardMode } from '@/types/board';
import { useDeleteBoard } from '@hooks/useBoards';
import ReadinessBar from './ReadinessBar';

export interface BoardCardProps {
  board: Board;
  onExpand?: (boardId: string) => void;
  expanded?: boolean;
}

// Map board type to badge variant
function typeBadgeVariant(type: string): BadgeVariant {
  switch (type) {
    case 'simulation':
      return 'info';
    case 'validation':
      return 'success';
    case 'optimization':
      return 'warning';
    case 'manufacturing':
      return 'danger';
    case 'analysis':
      return 'neutral';
    default:
      return 'neutral';
  }
}

// Map board mode to badge variant + style
function modeBadgeProps(mode: BoardMode): { variant: BadgeVariant; badgeStyle: BadgeStyle } {
  switch (mode) {
    case 'explore':
      return { variant: 'neutral', badgeStyle: 'outline' };
    case 'study':
      return { variant: 'warning', badgeStyle: 'outline' };
    case 'release':
      return { variant: 'danger', badgeStyle: 'outline' };
  }
}

// Map status to a readable string
function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const BoardCard: React.FC<BoardCardProps> = React.memo(({ board, onExpand, expanded }) => {
  const navigate = useNavigate();
  const deleteBoardMutation = useDeleteBoard();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasChildren = (board.children_count ?? 0) > 0;

  const handleClick = () => {
    navigate(`/boards/${board.id}`);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.(board.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      deleteBoardMutation.mutate(board.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Card hover className="cursor-pointer" onClick={handleClick}>
      <Card.Body className="space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-content-primary truncate">{board.name}</h3>
          {hasChildren && (
            <button
              type="button"
              onClick={handleExpandClick}
              className={cn(
                'flex-shrink-0 p-0.5 text-content-muted hover:text-content-primary transition-transform duration-200',
                expanded && 'rotate-90'
              )}
              aria-label="Expand sub-boards"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={typeBadgeVariant(board.type)}>{board.type}</Badge>
          <Badge {...modeBadgeProps(board.mode)}>{board.mode}</Badge>
        </div>

        {/* Readiness */}
        {board.readiness != null ? (
          <ReadinessBar readiness={board.readiness} />
        ) : (
          <span className="text-xs text-content-muted">&mdash;</span>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between text-xs text-content-secondary">
          <span>{statusLabel(board.status)}</span>
          <div className="flex items-center gap-2">
            <span>{formatRelativeTime(board.updated_at)}</span>
            <button
              type="button"
              onClick={handleDeleteClick}
              className={cn(
                'p-1 rounded-sm transition-colors opacity-0 group-hover:opacity-100',
                confirmDelete
                  ? 'text-red-600 bg-red-50 opacity-100'
                  : 'text-content-muted hover:text-red-600'
              )}
              aria-label={confirmDelete ? 'Confirm delete' : 'Delete board'}
              title={confirmDelete ? 'Click again to confirm' : 'Delete board'}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
});

BoardCard.displayName = 'BoardCard';

export default BoardCard;
