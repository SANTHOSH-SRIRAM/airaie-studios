// ============================================================
// BoardCard — improved grid view card for a single board
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Trash2, Clock, Layers, GitBranch,
  Beaker, Shield, Rocket, MoreHorizontal,
} from 'lucide-react';
import { Card, Badge, cn, formatRelativeTime } from '@airaie/ui';
import type { BadgeVariant, BadgeStyle } from '@airaie/ui';
import type { Board, BoardMode } from '@/types/board';
import { useDeleteBoard } from '@hooks/useBoards';

export interface BoardCardProps {
  board: Board;
  onExpand?: (boardId: string) => void;
  expanded?: boolean;
}

// --- Mode config ---
const MODE_CONFIG: Record<BoardMode, { icon: React.ElementType; variant: BadgeVariant; color: string; label: string }> = {
  explore: { icon: Beaker, variant: 'success', color: 'bg-green-500', label: 'Explore' },
  study:   { icon: Shield, variant: 'warning', color: 'bg-amber-500', label: 'Study' },
  release: { icon: Rocket, variant: 'danger',  color: 'bg-red-500',   label: 'Release' },
};

// --- Status config ---
const STATUS_CONFIG: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  active:    { variant: 'success', dot: true },
  DRAFT:     { variant: 'neutral', dot: true },
  draft:     { variant: 'neutral', dot: true },
  completed: { variant: 'info',    dot: true },
  archived:  { variant: 'neutral', dot: false },
};

const BoardCard: React.FC<BoardCardProps> = React.memo(({ board, onExpand, expanded }) => {
  const navigate = useNavigate();
  const deleteBoardMutation = useDeleteBoard();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = (board.children_count ?? 0) > 0;
  const modeConfig = MODE_CONFIG[board.mode] ?? MODE_CONFIG.explore;
  const statusConfig = STATUS_CONFIG[board.status] ?? { variant: 'neutral' as BadgeVariant, dot: true };
  const ModeIcon = modeConfig.icon;

  const handleClick = () => navigate(`/boards/${board.id}`);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.(board.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      deleteBoardMutation.mutate(board.id);
      setShowMenu(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Card hover className="cursor-pointer group relative" onClick={handleClick}>
      {/* Top accent bar — color-coded by mode */}
      <div className={cn('h-1 w-full', modeConfig.color)} />

      <Card.Body className="space-y-3 pt-3">
        {/* Header: Title + mode icon */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-content-primary leading-tight truncate">
              {board.name}
            </h3>
            {board.description && (
              <p className="text-xs text-content-tertiary mt-1 line-clamp-2 leading-relaxed">
                {board.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasChildren && (
              <button
                type="button"
                onClick={handleExpandClick}
                className={cn(
                  'p-1 text-content-muted hover:text-content-primary transition-transform duration-200',
                  expanded && 'rotate-90'
                )}
                aria-label="Expand sub-boards"
              >
                <ChevronRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 text-content-muted hover:text-content-primary opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Board actions"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Badges: type + mode + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="neutral" className="text-[10px]">{board.type}</Badge>
          <Badge variant={modeConfig.variant} dot className="text-[10px]">
            {modeConfig.label}
          </Badge>
          <Badge variant={statusConfig.variant} dot={statusConfig.dot} className="text-[10px]">
            {board.status}
          </Badge>
        </div>

        {/* Readiness bar */}
        {board.readiness != null && board.readiness > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-content-tertiary">
              <span>Readiness</span>
              <span className="font-medium">{Math.round(board.readiness * 100)}%</span>
            </div>
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  board.readiness >= 0.8 ? 'bg-green-500' : board.readiness >= 0.5 ? 'bg-amber-500' : 'bg-blue-500'
                )}
                style={{ width: `${Math.round(board.readiness * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Footer: timestamp + owner */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-border">
          <div className="flex items-center gap-1 text-[10px] text-content-muted">
            <Clock size={10} />
            <span>{formatRelativeTime(board.updated_at)}</span>
          </div>
          {board.owner && (
            <span className="text-[10px] text-content-muted truncate max-w-[100px]" title={board.owner}>
              {board.owner}
            </span>
          )}
        </div>
      </Card.Body>

      {/* Dropdown menu (delete) */}
      {showMenu && (
        <div
          className="absolute top-10 right-2 z-10 bg-white border border-surface-border shadow-lg rounded py-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleDeleteClick}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left transition-colors',
              confirmDelete ? 'text-red-600 bg-red-50 font-medium' : 'text-content-secondary hover:bg-surface-hover'
            )}
          >
            <Trash2 size={12} />
            {confirmDelete ? 'Confirm Delete' : 'Delete Board'}
          </button>
        </div>
      )}
    </Card>
  );
});

BoardCard.displayName = 'BoardCard';

export default BoardCard;
