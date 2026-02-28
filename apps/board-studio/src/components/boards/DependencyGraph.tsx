// ============================================================
// DependencyGraph — @xyflow/react v12 + dagre auto-layout DAG
// ============================================================

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { Spinner } from '@airaie/ui';
import { useCardGraph } from '@hooks/useCards';
import { useCards } from '@hooks/useCards';
import type { Card, CardStatus } from '@/types/board';
import CardComponent from './CardComponent';

export interface DependencyGraphProps {
  boardId: string;
  selectedCardId?: string;
  onCardSelect?: (cardId: string) => void;
}

// --- Status -> background color mapping ---

const statusBgColors: Record<CardStatus, string> = {
  completed: '#dcfce7', // green-100
  failed: '#fee2e2', // red-100
  running: '#dbeafe', // blue-100
  pending: '#f8fafc', // slate-50
  blocked: '#fef3c7', // amber-100
  skipped: '#f1f5f9', // slate-100
  waived: '#fef9c3', // yellow-100
  cancelled: '#f1f5f9', // slate-100
};

// --- Custom node component for ReactFlow ---

interface CardNodeData {
  card: Card;
  [key: string]: unknown;
}

function CardNode({ data }: { data: CardNodeData }) {
  return (
    <div style={{ width: 200 }}>
      <CardComponent card={data.card} compact />
    </div>
  );
}

const nodeTypes = { cardNode: CardNode };

// --- Dagre layout helper ---

function getLayoutedElements(
  nodes: Node<CardNodeData>[],
  edges: Edge[]
): { nodes: Node<CardNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: 100 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// --- Main component ---

const DependencyGraph: React.FC<DependencyGraphProps> = ({ boardId, selectedCardId, onCardSelect }) => {
  const navigate = useNavigate();
  const { data: graphData, isLoading: graphLoading } = useCardGraph(boardId);
  const { data: cards, isLoading: cardsLoading } = useCards(boardId);

  const isLoading = graphLoading || cardsLoading;

  // Build a map of card ID -> Card for quick lookup
  const cardMap = useMemo(() => {
    const map = new Map<string, Card>();
    cards?.forEach((c) => map.set(c.id, c));
    return map;
  }, [cards]);

  // Convert graph data to ReactFlow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!graphData || !cards) {
      return { nodes: [] as Node<CardNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<CardNodeData>[] = graphData.nodes.map((gn) => {
      const card = cardMap.get(gn.id);
      const status = (card?.status ?? gn.status ?? 'pending') as CardStatus;
      return {
        id: gn.id,
        type: 'cardNode',
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
        },
        style: {
          backgroundColor: statusBgColors[status] ?? '#f8fafc',
          border: gn.id === selectedCardId ? '2px solid #3b5fa8' : '1px solid #e2e8f0',
          borderRadius: '0',
          padding: '0',
        },
      };
    });

    const rfEdges: Edge[] = graphData.edges.map((ge, i) => {
      const targetCard = cardMap.get(ge.target);
      const isRunning = targetCard?.status === 'running';
      return {
        id: `e-${ge.source}-${ge.target}-${i}`,
        source: ge.source,
        target: ge.target,
        animated: isRunning,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      };
    });

    return getLayoutedElements(rfNodes, rfEdges);
  }, [graphData, cards, cardMap, boardId, selectedCardId]);

  // Handle node click -> select card or navigate to card detail
  const onNodeClick: NodeMouseHandler<Node<CardNodeData>> = useCallback(
    (_event, node) => {
      if (onCardSelect) {
        onCardSelect(node.id);
      } else {
        navigate(`/boards/${boardId}/cards/${node.id}`);
      }
    },
    [navigate, boardId, onCardSelect]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-content-tertiary">
        No cards to display in graph view.
      </div>
    );
  }

  return (
    <div className="h-[500px] border border-surface-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const card = (node.data as CardNodeData)?.card;
            if (!card) return '#f1f5f9';
            return statusBgColors[card.status] ?? '#f1f5f9';
          }}
        />
      </ReactFlow>
    </div>
  );
};

DependencyGraph.displayName = 'DependencyGraph';

export default DependencyGraph;
