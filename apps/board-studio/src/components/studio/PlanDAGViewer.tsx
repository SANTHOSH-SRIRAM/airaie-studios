// ============================================================
// PlanDAGViewer — Horizontal ReactFlow DAG for execution plans
// ============================================================

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { AlertTriangle } from 'lucide-react';
import PlanDAGNode from './PlanDAGNode';
import type { PlanDAGNodeData } from './PlanDAGNode';
import PlanNodeDetail from './PlanNodeDetail';
import type { PlanResponse, PlanExecutionStatus } from '@api/plans';
import type { PlanStep } from '@/types/board';

// --- Props ---

interface CompatibleTool {
  tool_id: string;
  name: string;
  tool_version: string;
}

interface PlanDAGViewerProps {
  plan: PlanResponse;
  execStatus?: PlanExecutionStatus;
  isExecuting: boolean;
  cardId?: string;
  onStepEdit?: (
    stepId: string,
    changes: {
      parameters?: Record<string, unknown>;
      tool_id?: string;
      tool_version?: string;
    }
  ) => void;
  planModified?: boolean;
  compatibleTools?: CompatibleTool[];
}

// --- Node types registry (stable reference) ---

const nodeTypes = { planDAGNode: PlanDAGNode };

// --- Dagre layout helper (LR = horizontal left-to-right) ---

function getLayoutedElements(
  nodes: Node<PlanDAGNodeData>[],
  edges: Edge[]
): { nodes: Node<PlanDAGNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });

  const nodeWidth = 180;
  const nodeHeight = 80;

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

// --- FitView helper component (handles fitView on init/changes) ---

function FitViewOnChange({ steps, isExecuting }: { steps: PlanStep[]; isExecuting: boolean }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    // Small delay to let ReactFlow render nodes before fitting
    const timer = setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => clearTimeout(timer);
  }, [fitView, steps, isExecuting]);
  return null;
}

// --- Main component ---

export default function PlanDAGViewer({
  plan,
  execStatus,
  isExecuting,
  cardId,
  onStepEdit,
  planModified,
  compatibleTools,
}: PlanDAGViewerProps) {
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null);

  // Merge live execution data with plan steps
  const mergedSteps = useMemo(() => {
    if (!plan?.steps) return [];
    return plan.steps.map((step) => {
      if (execStatus?.steps) {
        const liveStep = execStatus.steps.find((s) => s.id === step.id);
        if (liveStep) {
          return { ...step, status: liveStep.status };
        }
      }
      return step;
    });
  }, [plan?.steps, execStatus?.steps]);

  // Build memoization key from step ids + statuses + progress
  const stepsKey = useMemo(
    () => mergedSteps.map((s) => `${s.id}:${s.status}:${s.progress ?? ''}`).join('|'),
    [mergedSteps]
  );

  // Convert steps to ReactFlow nodes + edges
  const { nodes, edges } = useMemo(() => {
    if (mergedSteps.length === 0) {
      return { nodes: [] as Node<PlanDAGNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<PlanDAGNodeData>[] = mergedSteps.map((step) => ({
      id: step.id,
      type: 'planDAGNode',
      position: { x: 0, y: 0 },
      data: { step },
    }));

    const rfEdges: Edge[] = [];
    mergedSteps.forEach((step) => {
      step.depends_on.forEach((depId) => {
        rfEdges.push({
          id: `e-${depId}-${step.id}`,
          source: depId,
          target: step.id,
          animated: step.status === 'running',
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        });
      });
    });

    return getLayoutedElements(rfNodes, rfEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsKey]);

  // Handle node click — toggle selection
  const onNodeClick: NodeMouseHandler<Node<PlanDAGNodeData>> = useCallback(
    (_event, node) => {
      const step = node.data.step;
      setSelectedStep((prev) => (prev?.id === step.id ? null : step));
    },
    []
  );

  return (
    <div>
      {/* Plan modified warning banner */}
      {planModified && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded mb-2">
          <AlertTriangle size={14} />
          <span>Plan modified -- re-run preflight before executing.</span>
        </div>
      )}

      {/* ReactFlow DAG */}
      <div className="h-[350px] border border-surface-border rounded">
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
          <FitViewOnChange steps={mergedSteps} isExecuting={isExecuting} />
        </ReactFlow>
      </div>

      {/* Inline detail panel below DAG */}
      {selectedStep && (
        <PlanNodeDetail
          step={selectedStep}
          onClose={() => setSelectedStep(null)}
          onStepEdit={onStepEdit}
          compatibleTools={compatibleTools}
          editing={!!onStepEdit && !isExecuting}
        />
      )}
    </div>
  );
}
