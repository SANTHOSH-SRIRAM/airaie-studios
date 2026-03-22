// ============================================================
// LineageDAGViewer — Horizontal ReactFlow DAG for artifact lineage
// ============================================================

import React, { useMemo, useEffect, memo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { Spinner } from '@airaie/ui';
import { useArtifactLineage } from '@hooks/useArtifactLineage';
import type { ArtifactLineageNode } from '@/types/analytics';

// --- Props ---

interface LineageDAGViewerProps {
  artifactId: string;
  highlightId?: string;
}

// --- Node data shape ---

interface LineageNodeData {
  lineageNode: ArtifactLineageNode;
  highlighted: boolean;
  dimmed: boolean;
  [key: string]: unknown;
}

// --- Dagre layout helper (LR = horizontal left-to-right) ---

function getLayoutedElements(
  nodes: Node<LineageNodeData>[],
  edges: Edge[]
): { nodes: Node<LineageNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 60 });

  const nodeWidth = 160;
  const nodeHeight = 60;

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

function FitViewOnChange({ nodeCount }: { nodeCount: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => clearTimeout(timer);
  }, [fitView, nodeCount]);
  return null;
}

// --- Custom node components ---

function LineageInputNode({ data }: { data: LineageNodeData }) {
  const { lineageNode, highlighted, dimmed } = data;
  return (
    <div
      className={`border-l-4 border-l-blue-500 border border-surface-border rounded px-2.5 py-1.5 min-w-[140px] max-w-[180px] bg-white
        ${highlighted ? 'ring-2 ring-yellow-400' : ''}
        ${dimmed ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <div className="text-xs font-medium text-content-primary truncate">{lineageNode.name}</div>
      {lineageNode.hash && (
        <div className="text-[10px] font-mono text-content-muted mt-0.5">
          {lineageNode.hash.slice(0, 8)}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
}

function LineageToolNode({ data }: { data: LineageNodeData }) {
  const { lineageNode, highlighted, dimmed } = data;
  return (
    <div
      className={`border border-slate-300 rounded px-2.5 py-1.5 min-w-[140px] max-w-[180px] bg-slate-50
        ${highlighted ? 'ring-2 ring-yellow-400' : ''}
        ${dimmed ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <div className="text-xs font-medium text-content-primary truncate">{lineageNode.name}</div>
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
}

function LineageOutputNode({ data }: { data: LineageNodeData }) {
  const { lineageNode, highlighted, dimmed } = data;
  return (
    <div
      className={`border-l-4 border-l-green-500 border border-surface-border rounded px-2.5 py-1.5 min-w-[140px] max-w-[180px] bg-white
        ${highlighted ? 'ring-2 ring-yellow-400' : ''}
        ${dimmed ? 'opacity-40' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
      <div className="text-xs font-medium text-content-primary truncate">{lineageNode.name}</div>
      {lineageNode.hash && (
        <div className="text-[10px] font-mono text-content-muted mt-0.5">
          {lineageNode.hash.slice(0, 8)}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
}

// --- Node type map for lineage nodes ---

const nodeTypeMap: Record<string, string> = {
  input: 'lineageInput',
  tool: 'lineageTool',
  output: 'lineageOutput',
};

// Stable nodeTypes registry
const nodeTypes = {
  lineageInput: memo(LineageInputNode),
  lineageTool: memo(LineageToolNode),
  lineageOutput: memo(LineageOutputNode),
};

// --- Main component ---

export default function LineageDAGViewer({ artifactId, highlightId }: LineageDAGViewerProps) {
  const { data, isLoading } = useArtifactLineage(artifactId);

  // Convert lineage data to ReactFlow nodes + edges
  const { nodes, edges } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) {
      return { nodes: [] as Node<LineageNodeData>[], edges: [] as Edge[] };
    }

    // Determine which node IDs are on the highlighted path
    const highlightedIds = new Set<string>();
    if (highlightId) {
      highlightedIds.add(highlightId);
      // Trace edges to find connected path
      const visited = new Set<string>();
      const queue = [highlightId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);
        highlightedIds.add(current);
        // Traverse forward and backward
        data.edges.forEach((e) => {
          if (e.source === current && !visited.has(e.target)) queue.push(e.target);
          if (e.target === current && !visited.has(e.source)) queue.push(e.source);
        });
      }
    }

    const rfNodes: Node<LineageNodeData>[] = data.nodes.map((ln) => ({
      id: ln.id,
      type: nodeTypeMap[ln.type] ?? 'lineageInput',
      position: { x: 0, y: 0 },
      data: {
        lineageNode: ln,
        highlighted: highlightId ? highlightedIds.has(ln.id) : false,
        dimmed: highlightId ? !highlightedIds.has(ln.id) : false,
      },
    }));

    const rfEdges: Edge[] = data.edges.map((e, i) => ({
      id: `le-${e.source}-${e.target}-${i}`,
      source: e.source,
      target: e.target,
      animated: highlightId
        ? highlightedIds.has(e.source) && highlightedIds.has(e.target)
        : false,
      style: {
        stroke: '#94a3b8',
        strokeWidth: 1.5,
      },
      label: e.label,
    }));

    return getLayoutedElements(rfNodes, rfEdges);
  }, [data, highlightId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[280px]">
        <Spinner />
      </div>
    );
  }

  // Empty state
  if (!data?.nodes || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-sm text-content-tertiary">
        No lineage data available
      </div>
    );
  }

  return (
    <div className="h-[280px] border border-surface-border rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <FitViewOnChange nodeCount={nodes.length} />
      </ReactFlow>
    </div>
  );
}
