// ============================================================
// CanvasToolbar — view mode switcher + contextual actions
// ============================================================

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid,
  GitBranch,
  Table2,
  GanttChart,
  Search,
  Plus,
  Play,
  Square,
  Copy,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@airaie/ui';
import type { Card } from '@/types/board';

export type ViewMode = 'board' | 'dag' | 'table' | 'timeline';

export interface CanvasToolbarProps {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  selectedCard: Card | undefined;
  onDeselectCard: () => void;
  onSearch?: () => void;
  onAddCard?: () => void;
  onRunCard?: (cardId: string) => void;
  onStopCard?: (cardId: string) => void;
  onDuplicateCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onViewCardDetail?: (cardId: string) => void;
}

const viewModes: { id: ViewMode; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'dag', label: 'DAG', icon: GitBranch },
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'timeline', label: 'Timeline', icon: GanttChart },
];

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  viewMode,
  onChangeView,
  selectedCard,
  onDeselectCard,
  onSearch,
  onAddCard,
  onRunCard,
  onStopCard,
  onViewCardDetail,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-white">
      {/* Left: View mode switcher */}
      <div className="flex items-center gap-0.5 bg-surface-bg p-0.5 border border-surface-border">
        {viewModes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChangeView(id)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all
              ${viewMode === id
                ? 'bg-white text-content-primary shadow-sm border border-surface-border'
                : 'text-content-tertiary hover:text-content-secondary border border-transparent'
              }
            `}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Right: Contextual actions */}
      <AnimatePresence mode="wait">
        {selectedCard ? (
          <motion.div
            key="card-actions"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5"
          >
            <span className="text-xs text-content-tertiary mr-1 truncate max-w-[140px]">
              {selectedCard.name}
            </span>

            {selectedCard.status === 'running' ? (
              <Button
                variant="outline"
                size="sm"
                icon={Square}
                onClick={() => onStopCard?.(selectedCard.id)}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                icon={Play}
                onClick={() => onRunCard?.(selectedCard.id)}
              >
                Run
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon={Eye}
              onClick={() => onViewCardDetail?.(selectedCard.id)}
            >
              Details
            </Button>

            <button
              onClick={onDeselectCard}
              className="px-2 py-1 text-xs text-content-muted hover:text-content-primary transition-colors"
            >
              ×
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="default-actions"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5"
          >
            <Button
              variant="ghost"
              size="sm"
              icon={Search}
              onClick={onSearch}
            >
              Search
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Filter}
            >
              Filter
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={ArrowUpDown}
            >
              Sort
            </Button>

            {onAddCard && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={onAddCard}
              >
                Add Card
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

CanvasToolbar.displayName = 'CanvasToolbar';

export default CanvasToolbar;
