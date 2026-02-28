// ============================================================
// BoardTableRow — table view row for a single board
// ============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Badge, cn, formatRelativeTime } from '@airaie/ui';
import type { BadgeVariant, BadgeStyle } from '@airaie/ui';
import type { Board, BoardMode } from '@/types/board';
import ReadinessBar from './ReadinessBar';

export interface BoardTableRowProps {
  board: Board;
  onExpand?: (boardId: string) => void;
  expanded?: boolean;
}

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
    default:
      return 'neutral';
  }
}

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

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const BoardTableRow: React.FC<BoardTableRowProps> = ({ board, onExpand, expanded }) => {
  const navigate = useNavigate();
  const hasChildren = (board.children_count ?? 0) > 0;

  const handleClick = () => {
    navigate(`/boards/${board.id}`);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.(board.id);
  };

  return (
    <tr
      className="border-b border-surface-border hover:bg-surface-hover cursor-pointer transition-colors"
      onClick={handleClick}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
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
              <ChevronRight size={14} />
            </button>
          )}
          <span className="text-sm font-medium text-content-primary truncate">{board.name}</span>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <Badge variant={typeBadgeVariant(board.type)}>{board.type}</Badge>
      </td>

      {/* Mode */}
      <td className="px-4 py-3">
        <Badge {...modeBadgeProps(board.mode)}>{board.mode}</Badge>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className="text-sm text-content-secondary">{statusLabel(board.status)}</span>
      </td>

      {/* Readiness */}
      <td className="px-4 py-3 w-32">
        <div className="flex items-center gap-2">
          <ReadinessBar readiness={board.readiness} className="flex-1" />
          <span className="text-xs text-content-muted w-8 text-right">
            {Math.round(board.readiness * 100)}%
          </span>
        </div>
      </td>

      {/* Updated */}
      <td className="px-4 py-3">
        <span className="text-xs text-content-secondary">{formatRelativeTime(board.updated_at)}</span>
      </td>
    </tr>
  );
};

BoardTableRow.displayName = 'BoardTableRow';

export default BoardTableRow;
