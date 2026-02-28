// ============================================================
// PlanPreview — Interactive plan DAG using @xyflow/react v12 + dagre
// ============================================================

import React, { useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from 'dagre';
import { Badge, Spinner, Tooltip } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { usePlan, useCompilePlan } from '@hooks/usePlan';
import type { PlanStep } from '@/types/board';

export interface PlanPreviewProps {
  cardId: string | undefined;
}

// --- Step status -> colors & badge variants ---

const stepStatusColors: Record<string, string> = {
  pending: '#f8fafc',     // slate-50
  running: '#dbeafe',     // blue-100
  completed: '#dcfce7',   // green-100
  failed: '#fee2e2',      // red-100
  draft: '#f8fafc',       // slate-50
};

const stepStatusBadgeVariants: Record<string, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  draft: 'neutral',
};

// --- Custom node data ---

interface StepNodeData {
  step: PlanStep;
  [key: string]: unknown;
}

// --- Custom ReactFlow node for plan steps ---

function StepNode({ data }: { data: StepNodeData }) {
  const { step } = data;
  const isRunning = step.status === 'running';
  const paramEntries = Object.entries(step.parameters ?? {});

  return (
    <div
      className={`
        bg-white border border-surface-border shadow-sm px-3 py-2.5 min-w-[180px] max-w-[220px]
        ${isRunning ? 'animate-pulse' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />

      {/* Tool name */}
      <div className="font-medium text-xs text-content-primary truncate">
        {step.tool_name}
      </div>

      {/* Role */}
      <div className="text-[10px] text-content-muted mt-0.5 truncate">
        {step.role}
      </div>

      {/* Status badge */}
      <div className="mt-1.5">
        <Badge
          variant={stepStatusBadgeVariants[step.status] ?? 'neutral'}
          dot
          className="text-[10px]"
        >
          {step.status}
        </Badge>
      </div>

      {/* Parameter summary (first 2-3) */}
      {paramEntries.length > 0 && (
        <div className="mt-1.5 text-[10px] text-content-tertiary space-y-0.5">
          {paramEntries.slice(0, 3).map(([key, val]) => (
            <div key={key} className="truncate">
              <span className="text-content-muted">{key}:</span>{' '}
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </div>
          ))}
          {paramEntries.length > 3 && (
            <div className="text-content-muted">
              +{paramEntries.length - 3} more
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { stepNode: StepNode };

// --- Dagre layout helper (same pattern as DependencyGraph) ---

function getLayoutedElements(
  nodes: Node<StepNodeData>[],
  edges: Edge[]
): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 220, height: 110 });
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
        x: pos.x - 110,
        y: pos.y - 55,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// --- Step detail panel (shown on node click) ---

interface StepDetailPanelProps {
  step: PlanStep;
  editable: boolean;
  cardId: string | undefined;
  onClose: () => void;
}

function StepDetailPanel({ step, editable, cardId, onClose }: StepDetailPanelProps) {
  const compilePlan = useCompilePlan(cardId);
  const paramEntries = Object.entries(step.parameters ?? {});

  return (
    <div className="absolute top-2 right-2 z-10 w-64 bg-white border border-surface-border shadow-lg">
      <div className="px-3 py-2 border-b border-surface-border flex items-center justify-between">
        <span className="text-xs font-semibold text-content-primary">
          Step: {step.tool_name}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-content-muted hover:text-content-primary text-xs"
        >
          Close
        </button>
      </div>
      <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
        {/* Role */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">Role</span>
          <div className="text-xs text-content-primary">{step.role}</div>
        </div>

        {/* Version */}
        {step.tool_version && (
          <div>
            <span className="text-[10px] font-medium text-content-muted">Version</span>
            <div className="text-xs text-content-primary">{step.tool_version}</div>
          </div>
        )}

        {/* Dependencies */}
        {step.depends_on.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-content-muted">Depends On</span>
            <div className="text-xs text-content-primary">
              {step.depends_on.join(', ')}
            </div>
          </div>
        )}

        {/* Parameters */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">Parameters</span>
          {paramEntries.length === 0 ? (
            <div className="text-xs text-content-tertiary">No parameters</div>
          ) : (
            <div className="space-y-1 mt-1">
              {paramEntries.map(([key, val]) => (
                <div key={key}>
                  <span className="text-[10px] text-content-muted">{key}</span>
                  {editable ? (
                    <input
                      type="text"
                      defaultValue={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      className="block w-full text-xs border border-surface-border px-1.5 py-0.5 mt-0.5 text-content-primary bg-white focus:outline-none focus:ring-1 focus:ring-brand-secondary"
                      readOnly={!editable}
                    />
                  ) : (
                    <div className="text-xs text-content-primary truncate">
                      {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compile button for editable plans */}
        {editable && (
          <Tooltip content="Recompile plan after parameter edits" side="top">
            <button
              type="button"
              onClick={() => compilePlan.mutate()}
              disabled={compilePlan.isPending}
              className="text-xs text-brand-secondary hover:underline mt-2"
            >
              {compilePlan.isPending ? 'Compiling...' : 'Recompile Plan'}
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

const PlanPreview: React.FC<PlanPreviewProps> = ({ cardId }) => {
  const { data: plan, isLoading } = usePlan(cardId);
  const [selectedStep, setSelectedStep] = useState<PlanStep | null>(null);

  // Determine if plan is editable (draft or validated)
  const isEditable = plan?.status === 'draft' || plan?.status === 'validated';

  // Convert PlanStep[] to ReactFlow nodes + edges
  const { nodes, edges } = useMemo(() => {
    if (!plan?.steps?.length) {
      return { nodes: [] as Node<StepNodeData>[], edges: [] as Edge[] };
    }

    const rfNodes: Node<StepNodeData>[] = plan.steps.map((step) => ({
      id: step.id,
      type: 'stepNode',
      position: { x: 0, y: 0 },
      data: { step },
      style: {
        backgroundColor: stepStatusColors[step.status] ?? '#f8fafc',
        borderRadius: '0',
        padding: '0',
      },
    }));

    const rfEdges: Edge[] = [];
    plan.steps.forEach((step) => {
      step.depends_on.forEach((depId) => {
        const isRunning = step.status === 'running';
        rfEdges.push({
          id: `e-${depId}-${step.id}`,
          source: depId,
          target: step.id,
          animated: isRunning,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        });
      });
    });

    return getLayoutedElements(rfNodes, rfEdges);
  }, [plan]);

  // Handle node click
  const onNodeClick: NodeMouseHandler<Node<StepNodeData>> = useCallback(
    (_event, node) => {
      const step = (node.data as StepNodeData).step;
      setSelectedStep((prev) => (prev?.id === step.id ? null : step));
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (!plan || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-content-tertiary border border-dashed border-surface-border">
        No execution plan yet. Generate a plan from the tools above.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Plan status header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-content-primary">Execution Plan</span>
        <Badge
          variant={stepStatusBadgeVariants[plan.status] ?? 'neutral'}
          dot
          className="text-[10px]"
        >
          {plan.status}
        </Badge>
        {plan.cost_estimate && (
          <span className="text-[10px] text-content-muted">
            Est. cost: {plan.cost_estimate}
          </span>
        )}
        {plan.time_estimate && (
          <span className="text-[10px] text-content-muted">
            Est. time: {plan.time_estimate}
          </span>
        )}
      </div>

      {/* ReactFlow DAG */}
      <div className="h-[400px] border border-surface-border">
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
              const step = (node.data as StepNodeData)?.step;
              if (!step) return '#f1f5f9';
              return stepStatusColors[step.status] ?? '#f1f5f9';
            }}
          />
        </ReactFlow>

        {/* Step detail side panel */}
        {selectedStep && (
          <StepDetailPanel
            step={selectedStep}
            editable={isEditable}
            cardId={cardId}
            onClose={() => setSelectedStep(null)}
          />
        )}
      </div>
    </div>
  );
};

PlanPreview.displayName = 'PlanPreview';

export default PlanPreview;
