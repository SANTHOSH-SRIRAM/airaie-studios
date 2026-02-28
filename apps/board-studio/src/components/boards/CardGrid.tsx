// ============================================================
// CardGrid — Kanban columns + DependencyGraph toggle
// ============================================================

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, GitBranch, Plus } from 'lucide-react';
import { Button, Spinner, Badge } from '@airaie/ui';
import { useCards } from '@hooks/useCards';
import type { Card, CardStatus } from '@/types/board';
import CardComponent from './CardComponent';
import DependencyGraph from './DependencyGraph';
import AddCardDialog from './AddCardDialog';

export interface CardGridProps {
  boardId: string;
}

// --- Kanban column definitions ---

const kanbanColumns: { status: CardStatus; label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'running', label: 'Running' },
  { status: 'completed', label: 'Completed' },
  { status: 'failed', label: 'Failed' },
];

// --- Main component ---

const CardGrid: React.FC<CardGridProps> = ({ boardId }) => {
  const navigate = useNavigate();
  const { data: cards, isLoading } = useCards(boardId);
  const [viewMode, setViewMode] = useState<'kanban' | 'graph'>('kanban');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Group cards by status for Kanban view
  const columnCards = useMemo(() => {
    const grouped: Record<string, Card[]> = {};
    kanbanColumns.forEach((col) => {
      grouped[col.status] = [];
    });

    cards?.forEach((card) => {
      if (grouped[card.status]) {
        grouped[card.status].push(card);
      } else {
        // Cards with statuses not in kanban columns (blocked, skipped, waived, cancelled)
        // go into the pending column
        grouped['pending']?.push(card);
      }
    });

    // Sort each column by ordinal
    Object.values(grouped).forEach((list) => {
      list.sort((a, b) => a.ordinal - b.ordinal);
    });

    return grouped;
  }, [cards]);

  const handleCardClick = (card: Card) => {
    navigate(`/boards/${boardId}/cards/${card.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors
              ${viewMode === 'kanban' ? 'bg-white shadow-sm text-content-primary' : 'text-content-tertiary hover:text-content-primary'}
            `}
          >
            <LayoutGrid size={14} />
            Kanban
          </button>
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors
              ${viewMode === 'graph' ? 'bg-white shadow-sm text-content-primary' : 'text-content-tertiary hover:text-content-primary'}
            `}
          >
            <GitBranch size={14} />
            Graph
          </button>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Card
        </Button>
      </div>

      {/* View content */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-4 gap-3">
          {kanbanColumns.map((col) => {
            const colCards = columnCards[col.status] ?? [];
            return (
              <div key={col.status} className="space-y-2">
                {/* Column header */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 border border-surface-border">
                  <span className="text-xs font-semibold text-content-primary uppercase tracking-wide">
                    {col.label}
                  </span>
                  <Badge variant="neutral" className="text-[10px]">
                    {colCards.length}
                  </Badge>
                </div>

                {/* Cards */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {colCards.length === 0 ? (
                    <div className="text-xs text-content-muted text-center py-6 border border-dashed border-surface-border">
                      No cards
                    </div>
                  ) : (
                    colCards.map((card) => (
                      <CardComponent
                        key={card.id}
                        card={card}
                        onClick={handleCardClick}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <DependencyGraph boardId={boardId} />
      )}

      {/* Add card dialog */}
      <AddCardDialog
        boardId={boardId}
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  );
};

CardGrid.displayName = 'CardGrid';

export default CardGrid;
