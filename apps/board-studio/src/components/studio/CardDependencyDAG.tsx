// ============================================================
// CardDependencyDAG -- Board-level card dependency visualization
// Renders a horizontal DAG showing card-to-card data flow
// ============================================================

import React, { useMemo, useCallback, useEffect, memo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Card, CardType, CardStatus } from '@/types/board';

// --- Props ---

interface CardDependencyDAGProps {
  cards: Card[];
  onNodeClick?: (cardId: string) => void;
}

// --- Node data shape ---

interface CardDepNodeData {
  card: Card;
  [key: string]: unknown;
}

// --- Badge variant mappings ---

const cardTypeVariants: Record<CardType, BadgeVariant> = {
  analysis: 'info',
  comparison: 'info',
  sweep: 'warning',
  agent: 'neutral',
  gate: 'success',
  milestone: 'neutral',
};

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

// --- Border color by status ---

const statusBorderClasses: Record<string, string> = {
  completed: 'border-l-green-500',
  failed: 'border-l-red-500',
  running: 'border-l-blue-500',
  queued: 'border-l-blue-300',
};

// --- Custom node component ---

function CardDepNodeInner({ data }: { data: CardDepNodeData }) {
  const { card } = data;
  const borderClass = statusBorderClasses[card.status] ?? 'border-l-gray-300';
  const displayName = card.name.length > 20 ? card.name.slice(0, 20) + '...' : card.name;

  return (
    <div
      className={`border border-surface-border border-l-4 ${borderClass} rounded px-3 py-2 min-w-[160px] max-w-[200px] bg-white`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-slate-400 !w-2 !h-2"
      />

      {/* Card name */}
      <div className="font-medium text-xs text-content-primary truncate">
        {displayName}
      </div>

      {/* Type + Status badges */}
      <div className="mt-1.5 flex items-center gap-1">
        <Badge variant={cardTypeVariants[card.type] ?? 'neutral'} className="text-[8px]">
          {card.type}
        </Badge>
        <Badge variant={cardStatusVariants[card.status] ?? 'neutral'} dot className="text-[8px]">
          {card.status}
        </Badge>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-slate-400 !w-2 !h-2"
      />
    </div>
  );
}

const CardDepNode = memo(CardDepNodeInner);
CardDepNode.displayName = 'CardDepNode';

// --- Node types registry (stable reference) ---

const nodeTypes = { cardDepNode: CardDepNode };

// --- Dagre layout helper (LR = horizontal left-to-right) ---

function getLayoutedElements(
  nodes: Node<CardDepNodeData>[],
  edges: Edge[]
): { nodes: Node<CardDepNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  const nodeWidth = 180;
  const nodeHeight = 70;

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// --- FitView helper ---

function FitViewOnChange({ cards }: { cards: Card[] }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => clearTimeout(timer);
  }, [fitView, cards]);
  return null;
}

// --- Main component ---

export default function CardDependencyDAG({ cards, onNodeClick }: CardDependencyDAGProps) {
  // Build memoization key
  const cardsKey = useMemo(
    () => cards.map((c) => `${c.id}:${c.status}`).join('|'),
    [cards]
  );

  // Convert cards to ReactFlow nodes + edges
  const { nodes, edges } = useMemo(() => {
    if (cards.length === 0) {
      return { nodes: [] as Node<CardDepNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<CardDepNodeData>[] = cards.map((card) => ({
      id: card.id,
      type: 'cardDepNode',
      position: { x: 0, y: 0 },
      data: { card },
    }));

    const rfEdges: Edge[] = [];
    cards.forEach((card) => {
      (card.dependencies ?? []).forEach((depId) => {
        rfEdges.push({
          id: `e-${depId}-${card.id}`,
          source: depId,
          target: card.id,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        });
      });
    });

    return getLayoutedElements(rfNodes, rfEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsKey]);

  // Handle node click
  const handleNodeClick: NodeMouseHandler<Node<CardDepNodeData>> = useCallback(
    (_event, node) => {
      onNodeClick?.(node.data.card.id);
    },
    [onNodeClick]
  );

  return (
    <div className="h-[350px] border border-surface-border rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <FitViewOnChange cards={cards} />
      </ReactFlow>
    </div>
  );
}
