// ============================================================
// BoardHeader — board detail header with metadata + actions
// ============================================================

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Archive, Pencil, ArrowUpRight } from 'lucide-react';
import { Badge, Button } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Board, BoardMode } from '@/types/board';
import { escalateBoard, updateBoard } from '@api/boards';
import { boardKeys } from '@hooks/useBoards';
import { ROUTES } from '@/constants/routes';

export interface BoardHeaderProps {
  board: Board;
}

const modeVariants: Record<BoardMode, BadgeVariant> = {
  explore: 'info',
  study: 'warning',
  release: 'success',
};

const modeEscalationTarget: Partial<Record<BoardMode, BoardMode>> = {
  explore: 'study',
  study: 'release',
};

const BoardHeader: React.FC<BoardHeaderProps> = ({ board }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const escalateMutation = useMutation({
    mutationFn: (targetMode: string) => escalateBoard(board.id, targetMode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(board.id) });
      qc.invalidateQueries({ queryKey: boardKeys.summary(board.id) });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => updateBoard(board.id, { status: 'archived' }),
    onSuccess: () => {
      navigate(ROUTES.BOARDS);
    },
  });

  const nextMode = modeEscalationTarget[board.mode];

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-content-tertiary">
        <Link
          to={ROUTES.BOARDS}
          className="hover:text-content-primary transition-colors"
        >
          Boards
        </Link>
        <ChevronRight size={14} />
        <span className="text-content-primary font-medium truncate">
          {board.name}
        </span>
      </nav>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl font-bold text-content-primary truncate">
            {board.name}
          </h1>
          <Badge variant={modeVariants[board.mode]} dot>
            {board.mode}
          </Badge>
          <Badge variant="neutral">{board.type}</Badge>
          <Badge
            variant={board.status === 'active' ? 'success' : 'neutral'}
            dot
          >
            {board.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {nextMode && board.status !== 'archived' && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowUpRight}
              loading={escalateMutation.isPending}
              onClick={() => escalateMutation.mutate(nextMode)}
            >
              Escalate to {nextMode}
            </Button>
          )}
          <Button variant="secondary" size="sm" icon={Pencil}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Archive}
            loading={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
            disabled={board.status === 'archived'}
          >
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
};

BoardHeader.displayName = 'BoardHeader';

export default BoardHeader;
