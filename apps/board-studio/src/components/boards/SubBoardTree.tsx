// ============================================================
// SubBoardTree — expandable tree for sub-boards (up to 3 levels)
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { Badge, Spinner, cn } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardChildren } from '@hooks/useBoards';
import type { Board, BoardMode } from '@/types/board';
import ReadinessBar from './ReadinessBar';

export interface SubBoardTreeProps {
  boardId: string;
  depth?: number;
  maxDepth?: number;
  onCreateSubBoard?: (parentBoardId: string) => void;
}

function modeBadgeVariant(mode: BoardMode): BadgeVariant {
  switch (mode) {
    case 'explore':
      return 'neutral';
    case 'study':
      return 'warning';
    case 'release':
      return 'danger';
  }
}

const SubBoardTreeItem: React.FC<{ board: Board; depth: number; maxDepth: number }> = ({
  board,
  depth,
  maxDepth,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (board.children_count ?? 0) > 0;
  const canExpand = hasChildren && depth < maxDepth;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 hover:bg-surface-hover cursor-pointer transition-colors rounded-sm',
        )}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
        onClick={() => navigate(`/boards/${board.id}`)}
      >
        {canExpand ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className={cn(
              'flex-shrink-0 p-0.5 text-content-muted hover:text-content-primary transition-transform duration-200',
              expanded && 'rotate-90'
            )}
            aria-label="Expand sub-boards"
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <span className="w-5" />
        )}

        <span className="text-sm font-medium text-content-primary truncate flex-1">
          {board.name}
        </span>

        <Badge variant={modeBadgeVariant(board.mode)} badgeStyle="outline">
          {board.mode}
        </Badge>

        <div className="w-16">
          {board.readiness != null ? (
            <ReadinessBar readiness={board.readiness} />
          ) : (
            <span className="text-xs text-content-muted">&mdash;</span>
          )}
        </div>
      </div>

      {expanded && canExpand && (
        <SubBoardTree boardId={board.id} depth={depth + 1} maxDepth={maxDepth} />
      )}
    </div>
  );
};

const SubBoardTree: React.FC<SubBoardTreeProps> = ({ boardId, depth = 1, maxDepth = 3, onCreateSubBoard }) => {
  const { data: children, isLoading } = useBoardChildren(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="border-l border-surface-border ml-4">
      {children && children.length > 0 && children.map((child) => (
        <SubBoardTreeItem key={child.id} board={child} depth={depth} maxDepth={maxDepth} />
      ))}

      {/* Add Sub-Board button */}
      {onCreateSubBoard && depth <= 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateSubBoard(boardId);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-content-muted hover:text-brand-secondary hover:bg-surface-hover transition-colors w-full"
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
        >
          <Plus size={12} />
          <span>Add Sub-Board</span>
        </button>
      )}
    </div>
  );
};

SubBoardTree.displayName = 'SubBoardTree';

export default SubBoardTree;
