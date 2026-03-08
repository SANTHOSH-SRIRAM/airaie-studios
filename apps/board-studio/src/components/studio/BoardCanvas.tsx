// ============================================================
// BoardCanvas — multi-view canvas (Board / DAG / Table / Timeline)
// ============================================================

import React, { useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import Dagre from 'dagre';
import { Badge, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Card, CardStatus, CardType, Gate, Board } from '@/types/board';
import { studioNodeTypes, type StudioCardNodeData } from './CardNode';
import { resolveVerticalSlug } from '@hooks/useVerticalConfig';
import CanvasToolbar, { type ViewMode } from './CanvasToolbar';

export interface BoardCanvasProps {
  boardId: string;
  board?: Board;
  cards: Card[];
  gates: Gate[];
  graphData: { nodes: { id: string; name: string; type: string; status: string }[]; edges: { source: string; target: string }[] } | undefined;
  isLoading: boolean;
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  selectedCardId: string | undefined;
  onSelectCard: (cardId: string) => void;
  onDeselectCard: () => void;
  onSearch?: () => void;
  onAddCard?: () => void;
  onRunCard?: (cardId: string) => void;
  onStopCard?: (cardId: string) => void;
  onViewCardDetail?: (cardId: string) => void;
  bottomPanel?: React.ReactNode;
}

// --- Status colors for DAG ---

const statusBgColors: Record<CardStatus, string> = {
  draft: '#f8fafc',
  ready: '#eff6ff',
  queued: '#fef3c7',
  running: '#eff6ff',
  completed: '#dcfce7',
  failed: '#fee2e2',
  blocked: '#fef3c7',
  skipped: '#f8fafc',
};

const statusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

const typeVariants: Record<CardType, BadgeVariant> = {
  analysis: 'info',
  comparison: 'info',
  sweep: 'warning',
  agent: 'neutral',
  gate: 'success',
  milestone: 'neutral',
};

// --- Dagre layout ---

function getLayoutedElements(
  nodes: Node<StudioCardNodeData>[],
  edges: Edge[]
): { nodes: Node<StudioCardNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 90 });

  nodes.forEach((node) => g.setNode(node.id, { width: 240, height: 80 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - 120, y: pos.y - 40 } };
    }),
    edges,
  };
}

// --- View components ---

function BoardView({
  cards,
  selectedCardId,
  onSelectCard,
}: {
  cards: Card[];
  selectedCardId: string | undefined;
  onSelectCard: (cardId: string) => void;
}) {
  const grouped = useMemo(() => {
    const groups: Record<string, Card[]> = {
      running: [],
      ready: [],
      queued: [],
      draft: [],
      completed: [],
      failed: [],
      blocked: [],
      skipped: [],
      other: [],
    };
    cards.forEach((card) => {
      const key = groups[card.status] ? card.status : 'other';
      groups[key].push(card);
    });
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [cards]);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      {grouped.map(([status, items]) => (
        <div key={status}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`studio-status-dot studio-status-dot--${status}`} />
            <span className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
              {status}
            </span>
            <span className="text-xs text-content-muted studio-mono">{items.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.sort((a, b) => a.ordinal - b.ordinal).map((card) => {
              const isSelected = card.id === selectedCardId;
              const kpiEntries = Object.entries(card.kpis ?? {});
              return (
                <motion.button
                  key={card.id}
                  layout
                  layoutId={`card-${card.id}`}
                  onClick={() => onSelectCard(card.id)}
                  className={`
                    text-left p-3 border bg-white transition-all cursor-pointer
                    hover:shadow-card-hover group relative
                    ${isSelected
                      ? 'border-blue-500 shadow-md'
                      : 'border-surface-border'
                    }
                    ${card.status === 'running' ? 'studio-pulse-ring' : ''}
                  `}
                >
                  {/* Status bar left edge */}
                  <div
                    className="absolute top-0 left-0 bottom-0 w-[3px]"
                    style={{ backgroundColor: statusBgColors[card.status] !== '#f8fafc'
                      ? `var(--status-${card.status === 'completed' ? 'completed' : card.status === 'failed' ? 'failed' : card.status === 'running' ? 'running' : card.status === 'blocked' ? 'blocked' : 'pending'}, ${statusBgColors[card.status]})`
                      : 'var(--status-pending, #f8fafc)'
                    }}
                  />

                  <div className="space-y-1.5 pl-1">
                    <div className="font-medium text-sm text-content-primary truncate">
                      {card.name}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={typeVariants[card.type]} className="text-[10px]">
                        {card.type}
                      </Badge>
                      <Badge variant={statusVariants[card.status]} dot className="text-[10px]">
                        {card.status}
                      </Badge>
                    </div>
                    {kpiEntries.length > 0 && (
                      <div className="text-[11px] text-content-muted studio-mono truncate">
                        {kpiEntries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
      {cards.length === 0 && (
        <div className="flex items-center justify-center h-48 text-sm text-content-tertiary">
          No cards yet. Add one to get started.
        </div>
      )}
    </div>
  );
}

function DAGView({
  cards,
  graphData,
  selectedCardId,
  onSelectCard,
  boardId,
  verticalSlug,
}: {
  cards: Card[];
  graphData: BoardCanvasProps['graphData'];
  selectedCardId: string | undefined;
  onSelectCard: (cardId: string) => void;
  boardId: string;
  verticalSlug?: string | null;
}) {
  const cardMap = useMemo(() => {
    const map = new Map<string, Card>();
    cards.forEach((c) => map.set(c.id, c));
    return map;
  }, [cards]);

  const { nodes, edges } = useMemo(() => {
    if (!graphData || !cards.length) {
      return { nodes: [] as Node<StudioCardNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<StudioCardNodeData>[] = graphData.nodes.map((gn) => {
      const card = cardMap.get(gn.id);
      const status = (card?.status ?? gn.status ?? 'draft') as CardStatus;
      return {
        id: gn.id,
        type: 'studioCardNode',
        position: { x: 0, y: 0 },
        data: {
          card: card ?? {
            id: gn.id,
            board_id: boardId,
            name: gn.name,
            type: gn.type as Card['type'],
            status,
            ordinal: 0,
            config: {},
            kpis: {},
            dependencies: [],
            created_at: '',
            updated_at: '',
          },
          selected: gn.id === selectedCardId,
          verticalSlug: verticalSlug ?? undefined,
        },
      };
    });

    const rfEdges: Edge[] = graphData.edges.map((ge, i) => {
      const targetCard = cardMap.get(ge.target);
      return {
        id: `e-${ge.source}-${ge.target}-${i}`,
        source: ge.source,
        target: ge.target,
        animated: targetCard?.status === 'running',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      };
    });

    return getLayoutedElements(rfNodes, rfEdges);
  }, [graphData, cards, cardMap, boardId, selectedCardId]);

  const onNodeClick: NodeMouseHandler<Node<StudioCardNodeData>> = useCallback(
    (_event, node) => onSelectCard(node.id),
    [onSelectCard]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-content-tertiary">
        No cards to display in graph view.
      </div>
    );
  }

  return (
    <div className="h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={studioNodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            const card = (node.data as StudioCardNodeData)?.card;
            if (!card) return '#f8fafc';
            return statusBgColors[card.status] ?? '#f8fafc';
          }}
          style={{ border: '1px solid var(--studio-border, #e2e8f0)' }}
        />
      </ReactFlow>
    </div>
  );
}

function TableView({
  cards,
  selectedCardId,
  onSelectCard,
}: {
  cards: Card[];
  selectedCardId: string | undefined;
  onSelectCard: (cardId: string) => void;
}) {
  const sorted = [...cards].sort((a, b) => a.ordinal - b.ordinal);

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-surface-bg border-b border-surface-border">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">#</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Name</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Type</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Status</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">KPIs</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-content-tertiary uppercase tracking-wider">Deps</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((card, i) => {
            const isSelected = card.id === selectedCardId;
            const kpiEntries = Object.entries(card.kpis ?? {});
            return (
              <tr
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`
                  cursor-pointer border-b border-surface-border transition-colors
                  ${isSelected ? 'bg-blue-50' : 'hover:bg-surface-hover'}
                `}
              >
                <td className="px-3 py-2 studio-mono text-content-muted text-xs">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-content-primary">{card.name}</td>
                <td className="px-3 py-2">
                  <Badge variant={typeVariants[card.type]} className="text-[10px]">{card.type}</Badge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`studio-status-dot studio-status-dot--${card.status}`} />
                    <span className="text-xs capitalize">{card.status}</span>
                  </div>
                </td>
                <td className="px-3 py-2 studio-mono text-xs text-content-muted">
                  {kpiEntries.length > 0
                    ? kpiEntries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : '—'}
                </td>
                <td className="px-3 py-2 studio-mono text-xs text-content-muted">
                  {card.dependencies?.length ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {cards.length === 0 && (
        <div className="flex items-center justify-center h-48 text-sm text-content-tertiary">
          No cards to display.
        </div>
      )}
    </div>
  );
}

function TimelineView({ cards, selectedCardId, onSelectCard }: {
  cards: Card[];
  selectedCardId: string | undefined;
  onSelectCard: (cardId: string) => void;
}) {
  const sorted = [...cards].sort((a, b) => a.ordinal - b.ordinal);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-border" />

        <div className="space-y-3">
          {sorted.map((card) => {
            const isSelected = card.id === selectedCardId;
            return (
              <button
                key={card.id}
                onClick={() => onSelectCard(card.id)}
                className={`
                  relative flex items-start gap-4 pl-10 pr-4 py-3 w-full text-left
                  border transition-all cursor-pointer
                  ${isSelected
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-white border-surface-border hover:shadow-card-hover'
                  }
                `}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-[11px] top-4 studio-status-dot studio-status-dot--${card.status}`}
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-content-primary truncate">
                      {card.name}
                    </span>
                    <Badge variant={statusVariants[card.status]} dot className="text-[10px]">
                      {card.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-content-muted studio-mono">
                    <span>{card.type}</span>
                    {card.started_at && (
                      <span>started {new Date(card.started_at).toLocaleDateString()}</span>
                    )}
                    {card.completed_at && (
                      <span>completed {new Date(card.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {cards.length === 0 && (
        <div className="flex items-center justify-center h-48 text-sm text-content-tertiary">
          No cards to display.
        </div>
      )}
    </div>
  );
}

// --- Main Canvas ---

const BoardCanvas: React.FC<BoardCanvasProps> = React.memo(({
  boardId,
  board,
  cards,
  graphData,
  isLoading,
  viewMode,
  onChangeView,
  selectedCardId,
  onSelectCard,
  onDeselectCard,
  onSearch,
  onAddCard,
  onRunCard,
  onStopCard,
  onViewCardDetail,
  bottomPanel,
}) => {
  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const verticalSlug = useMemo(() => resolveVerticalSlug(board), [board]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <CanvasToolbar
          viewMode={viewMode}
          onChangeView={onChangeView}
          selectedCard={undefined}
          onDeselectCard={onDeselectCard}
        />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CanvasToolbar
        viewMode={viewMode}
        onChangeView={onChangeView}
        selectedCard={selectedCard}
        onDeselectCard={onDeselectCard}
        onSearch={onSearch}
        onAddCard={onAddCard}
        onRunCard={onRunCard}
        onStopCard={onStopCard}
        onViewCardDetail={onViewCardDetail}
      />

      {/* View content with animated transitions */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {viewMode === 'board' && (
              <BoardView
                cards={cards}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
              />
            )}
            {viewMode === 'dag' && (
              <DAGView
                cards={cards}
                graphData={graphData}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
                boardId={boardId}
                verticalSlug={verticalSlug}
              />
            )}
            {viewMode === 'table' && (
              <TableView
                cards={cards}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
              />
            )}
            {viewMode === 'timeline' && (
              <TimelineView
                cards={cards}
                selectedCardId={selectedCardId}
                onSelectCard={onSelectCard}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom panel slot */}
      {bottomPanel}
    </div>
  );
});

BoardCanvas.displayName = 'BoardCanvas';

export default BoardCanvas;
