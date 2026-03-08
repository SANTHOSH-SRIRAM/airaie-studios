// ============================================================
// DependencyManager — add/remove dependencies in InspectorPanel
// ============================================================

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@airaie/ui';
import { useAddDependency, useRemoveDependency } from '@hooks/useCards';
import CardStatusBadge from './CardStatusBadge';
import type { Card, CardStatus } from '@/types/board';

interface DependencyManagerProps {
  card: Card;
  allCards: Card[];
  boardId: string;
}

const DependencyManager: React.FC<DependencyManagerProps> = ({
  card,
  allCards,
  boardId,
}) => {
  const [adding, setAdding] = useState(false);
  const [selectedDepId, setSelectedDepId] = useState('');
  const addDep = useAddDependency(boardId);
  const removeDep = useRemoveDependency(boardId);

  const depCards = allCards.filter((c) => card.dependencies?.includes(c.id));
  const dependentCards = allCards.filter((c) => c.dependencies?.includes(card.id));
  const availableCards = allCards.filter(
    (c) => c.id !== card.id && !card.dependencies?.includes(c.id)
  );

  const handleAdd = () => {
    if (!selectedDepId) return;
    addDep.mutate(
      { cardId: card.id, depId: selectedDepId },
      { onSuccess: () => { setAdding(false); setSelectedDepId(''); } }
    );
  };

  return (
    <div className="space-y-3">
      {/* Depends on */}
      <div>
        <div className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1.5">
          Depends on
        </div>
        {depCards.length > 0 ? (
          <div className="space-y-1">
            {depCards.map((dep) => (
              <div key={dep.id} className="flex items-center gap-2 text-xs">
                <CardStatusBadge status={dep.status as CardStatus} size="sm" showLabel={false} />
                <span className="flex-1 truncate text-content-primary">{dep.name}</span>
                <button
                  onClick={() => removeDep.mutate({ cardId: card.id, depId: dep.id })}
                  className="p-0.5 text-content-muted hover:text-red-500 transition-colors"
                  title="Remove dependency"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-content-muted">None</span>
        )}
      </div>

      {/* Dependents */}
      {dependentCards.length > 0 && (
        <div>
          <div className="text-[10px] text-content-tertiary uppercase tracking-wider mb-1.5">
            Blocks
          </div>
          <div className="space-y-1">
            {dependentCards.map((dep) => (
              <div key={dep.id} className="flex items-center gap-2 text-xs">
                <CardStatusBadge status={dep.status as CardStatus} size="sm" showLabel={false} />
                <span className="flex-1 truncate text-content-primary">{dep.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add dependency */}
      {adding ? (
        <div className="space-y-1.5 p-2 border border-surface-border bg-surface-bg">
          <select
            value={selectedDepId}
            onChange={(e) => setSelectedDepId(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white
              text-content-primary focus:outline-none focus:border-blue-500"
          >
            <option value="">Select a card...</option>
            {availableCards.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAdd}
              loading={addDep.isPending}
              disabled={!selectedDepId}
              className="text-[10px]"
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setAdding(false); setSelectedDepId(''); }}
              className="text-[10px]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          icon={Plus}
          onClick={() => setAdding(true)}
          className="text-[10px]"
        >
          Add Dependency
        </Button>
      )}
    </div>
  );
};

DependencyManager.displayName = 'DependencyManager';

export default DependencyManager;
