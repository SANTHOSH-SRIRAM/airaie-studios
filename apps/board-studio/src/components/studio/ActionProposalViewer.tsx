// ============================================================
// ActionProposalViewer — Horizontal ReactFlow DAG for agent proposals
// with per-action approval controls and bulk actions
// ============================================================

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { CheckCircle2, XCircle, Settings } from 'lucide-react';
import { Button } from '@airaie/ui';
import ActionProposalNode from './ActionProposalNode';
import type { ActionProposalNodeData } from './ActionProposalNode';
import type { ActionProposal } from '@/types/governance';
import { useEffect } from 'react';

// --- Props ---

interface ActionProposalViewerProps {
  proposal: ActionProposal;
  onApproveAction: (actionId: string) => void;
  onRejectAction: (actionId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onEditConstraints: () => void;
}

// --- Node types registry (stable reference outside component) ---

const nodeTypes = { actionProposalNode: ActionProposalNode };

// --- Dagre layout helper (LR = horizontal left-to-right) ---

function getLayoutedElements(
  nodes: Node<ActionProposalNodeData>[],
  edges: Edge[]
): { nodes: Node<ActionProposalNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  const nodeWidth = 190;
  const nodeHeight = 100;

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

// --- FitView helper component ---

function FitViewOnChange({ actionCount }: { actionCount: number }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => clearTimeout(timer);
  }, [fitView, actionCount]);
  return null;
}

// --- Main component ---

export default function ActionProposalViewer({
  proposal,
  onApproveAction,
  onRejectAction,
  onApproveAll,
  onRejectAll,
  onEditConstraints,
}: ActionProposalViewerProps) {
  const actions = proposal.actions;

  // Compute summary counts
  const approvedCount = actions.filter(
    (a) => a.approval === 'approved' || a.approval === 'auto-approved'
  ).length;
  const rejectedCount = actions.filter((a) => a.approval === 'rejected').length;
  const pendingCount = actions.filter((a) => a.approval === 'pending').length;

  // Build memoization key
  const actionsKey = useMemo(
    () => actions.map((a) => `${a.id}:${a.approval}:${a.confidence}`).join('|'),
    [actions]
  );

  // Convert actions to ReactFlow nodes + edges
  const { nodes, edges } = useMemo(() => {
    if (actions.length === 0) {
      return { nodes: [] as Node<ActionProposalNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<ActionProposalNodeData>[] = actions.map((action) => ({
      id: action.id,
      type: 'actionProposalNode',
      position: { x: 0, y: 0 },
      data: {
        action,
        onApprove: onApproveAction,
        onReject: onRejectAction,
      },
    }));

    const rfEdges: Edge[] = [];
    actions.forEach((action) => {
      action.depends_on.forEach((depId) => {
        rfEdges.push({
          id: `e-${depId}-${action.id}`,
          source: depId,
          target: action.id,
          animated: action.approval === 'pending',
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        });
      });
    });

    return getLayoutedElements(rfNodes, rfEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionsKey, onApproveAction, onRejectAction]);

  return (
    <div>
      {/* ReactFlow DAG */}
      <div className="h-[300px] border border-surface-border rounded">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <FitViewOnChange actionCount={actions.length} />
        </ReactFlow>
      </div>

      {/* Summary bar */}
      <div className="mt-2 text-xs text-content-secondary">
        {actions.length} actions, {approvedCount} approved, {rejectedCount} rejected, {pendingCount} pending
      </div>

      {/* Bulk action buttons */}
      <div className="mt-2 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          icon={CheckCircle2}
          onClick={onApproveAll}
          disabled={pendingCount === 0 && rejectedCount === 0}
        >
          Approve All
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={XCircle}
          onClick={onRejectAll}
          disabled={pendingCount === 0 && approvedCount === 0}
        >
          Reject All
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Settings}
          onClick={onEditConstraints}
        >
          Edit Constraints
        </Button>
      </div>
    </div>
  );
}
