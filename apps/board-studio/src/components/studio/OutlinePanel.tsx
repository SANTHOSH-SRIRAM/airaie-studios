// ============================================================
// OutlinePanel — tree view sidebar with cards, gates, tools
// ============================================================

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Layers, ShieldCheck, Wrench, Plus, Search } from 'lucide-react';
import type { Card, Gate, CardStatus, CardType, GateStatus } from '@/types/board';

export interface OutlinePanelProps {
  cards: Card[];
  gates: Gate[];
  selectedItemId: string | undefined;
  selectedItemType: 'card' | 'gate' | undefined;
  onSelectCard: (cardId: string) => void;
  onSelectGate: (gateId: string) => void;
  onAddCard?: () => void;
}

// --- Status dot class ---

function statusDotClass(status: CardStatus | GateStatus): string {
  const base = 'studio-status-dot';
  const s = status.toLowerCase();
  if (s === 'running' || s === 'evaluating') return `${base} studio-status-dot--running`;
  if (s === 'completed' || s === 'passed') return `${base} studio-status-dot--completed`;
  if (s === 'failed') return `${base} studio-status-dot--failed`;
  if (s === 'blocked') return `${base} studio-status-dot--blocked`;
  if (s === 'waived') return `${base} studio-status-dot--blocked`;
  if (s === 'ready') return `${base} studio-status-dot--running`;
  if (s === 'queued') return `${base} studio-status-dot--blocked`;
  if (s === 'draft') return `${base} studio-status-dot--pending`;
  if (s === 'skipped') return `${base} studio-status-dot--pending`;
  return `${base} studio-status-dot--pending`;
}

// --- Collapsible section ---

function OutlineSection({
  title,
  icon: Icon,
  count,
  defaultOpen = true,
  children,
  action,
}: {
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!open); } }}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-content-tertiary
          uppercase tracking-wider hover:bg-surface-hover transition-colors cursor-pointer"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <Icon size={12} />
        <span className="flex-1 text-left">{title}</span>
        <span className="text-content-muted studio-mono">{count}</span>
        {action}
      </div>
      {open && <div className="pb-1">{children}</div>}
    </div>
  );
}

// --- Main component ---

const OutlinePanel: React.FC<OutlinePanelProps> = ({
  cards,
  gates,
  selectedItemId,
  selectedItemType,
  onSelectCard,
  onSelectGate,
  onAddCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | ''>('');
  const [statusFilter, setStatusFilter] = useState<CardStatus | ''>('');

  const filteredCards = useMemo(() => {
    let result = [...cards];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((c) => c.type === typeFilter);
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    return result.sort((a, b) => a.ordinal - b.ordinal);
  }, [cards, searchQuery, typeFilter, statusFilter]);

  const sortedCards = filteredCards;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-border">
        <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Outline
        </span>
      </div>

      {/* Search & filters */}
      <div className="px-3 py-2 space-y-1.5 border-b border-surface-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-6 pr-2 py-1 text-xs border border-surface-border bg-white
              text-content-primary placeholder:text-content-muted
              focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CardType | '')}
            className="flex-1 px-1.5 py-1 text-[10px] border border-surface-border bg-white text-content-secondary"
          >
            <option value="">All types</option>
            <option value="analysis">Analysis</option>
            <option value="comparison">Comparison</option>
            <option value="sweep">Sweep</option>
            <option value="agent">Agent</option>
            <option value="gate">Gate</option>
            <option value="milestone">Milestone</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CardStatus | '')}
            className="flex-1 px-1.5 py-1 text-[10px] border border-surface-border bg-white text-content-secondary"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
            <option value="skipped">Skipped</option>
          </select>
        </div>
      </div>

      {/* Scrollable tree */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
        {/* Cards section */}
        <OutlineSection
          title="Cards"
          icon={Layers}
          count={cards.length}
          action={
            onAddCard ? (
              <button
                onClick={(e) => { e.stopPropagation(); onAddCard(); }}
                className="p-0.5 text-content-muted hover:text-content-primary transition-colors"
                title="Add card"
              >
                <Plus size={12} />
              </button>
            ) : undefined
          }
        >
          {sortedCards.map((card) => {
            const isSelected = selectedItemType === 'card' && selectedItemId === card.id;
            return (
              <button
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`
                  flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm
                  transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-blue-50 text-content-primary border-l-2 border-l-blue-500'
                    : 'text-content-secondary hover:bg-surface-hover border-l-2 border-l-transparent'
                  }
                `}
                style={{ paddingLeft: 'calc(16px + 8px)' }}
              >
                <span className={statusDotClass(card.status)} />
                <span className="truncate flex-1">{card.name}</span>
                <span className="text-[10px] text-content-muted capitalize studio-mono flex-shrink-0">
                  {card.type.slice(0, 3)}
                </span>
              </button>
            );
          })}
          {cards.length === 0 && (
            <div className="px-4 py-3 text-xs text-content-muted">No cards</div>
          )}
        </OutlineSection>

        {/* Gates section */}
        <OutlineSection
          title="Gates"
          icon={ShieldCheck}
          count={gates.length}
        >
          {gates.map((gate) => {
            const isSelected = selectedItemType === 'gate' && selectedItemId === gate.id;
            return (
              <button
                key={gate.id}
                onClick={() => onSelectGate(gate.id)}
                className={`
                  flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm
                  transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-blue-50 text-content-primary border-l-2 border-l-blue-500'
                    : 'text-content-secondary hover:bg-surface-hover border-l-2 border-l-transparent'
                  }
                `}
                style={{ paddingLeft: 'calc(16px + 8px)' }}
              >
                <span className={statusDotClass(gate.status)} />
                <span className="truncate flex-1">{gate.name}</span>
                <span className="text-[10px] text-content-muted flex-shrink-0">
                  {gate.type.replace('Gate', '')}
                </span>
              </button>
            );
          })}
          {gates.length === 0 && (
            <div className="px-4 py-3 text-xs text-content-muted">No gates</div>
          )}
        </OutlineSection>
      </div>
    </div>
  );
};

OutlinePanel.displayName = 'OutlinePanel';

export default OutlinePanel;
