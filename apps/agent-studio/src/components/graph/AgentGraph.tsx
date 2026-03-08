import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { useExecutionStore } from '@store/executionStore';
import { useSpecStore } from '@store/specStore';

interface SpecGraphInput {
  tools: { tool_ref: string }[];
  hasPolicy: boolean;
  hasApproval: boolean;
  hasScoring: boolean;
  hasMemory: boolean;
}

function buildGraphFromSpec(spec: SpecGraphInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let y = 0;
  const cx = 250;

  // Context assembly (always present)
  nodes.push({ id: 'context', type: 'context', position: { x: cx, y }, data: { label: 'Context Assembly', status: 'idle' } });
  y += 100;

  // Memory recall (if spec uses memory)
  if (spec.hasMemory) {
    nodes.push({ id: 'memory', type: 'memory', position: { x: cx - 150, y }, data: { label: 'Memory Recall', status: 'idle' } });
    edges.push({ id: 'e-ctx-mem', source: 'context', target: 'memory' });
  }

  // Scoring (if scoring config present)
  if (spec.hasScoring) {
    nodes.push({ id: 'scoring', type: 'scoring', position: { x: cx + 150, y }, data: { label: 'Tool Scoring', status: 'idle' } });
    edges.push({ id: 'e-ctx-score', source: 'context', target: 'scoring' });
  }

  y += 100;

  // Task decomposition
  nodes.push({ id: 'decompose', type: 'decompose', position: { x: cx, y }, data: { label: 'Task Decomposition', status: 'idle' } });
  if (spec.hasMemory) edges.push({ id: 'e-mem-decomp', source: 'memory', target: 'decompose' });
  if (spec.hasScoring) edges.push({ id: 'e-score-decomp', source: 'scoring', target: 'decompose' });
  if (!spec.hasMemory && !spec.hasScoring) edges.push({ id: 'e-ctx-decomp', source: 'context', target: 'decompose' });

  y += 100;

  // Proposal generation
  nodes.push({ id: 'proposal', type: 'proposal', position: { x: cx, y }, data: { label: 'Proposal Generation', status: 'idle' } });
  edges.push({ id: 'e-decomp-prop', source: 'decompose', target: 'proposal' });

  y += 100;

  // Policy engine (if policy configured)
  if (spec.hasPolicy) {
    nodes.push({ id: 'policy', type: 'policy', position: { x: cx, y }, data: { label: 'Policy Engine', status: 'idle' } });
    edges.push({ id: 'e-prop-policy', source: 'proposal', target: 'policy' });
    y += 100;
  }

  // Approval gate (if policy has approval thresholds)
  if (spec.hasApproval) {
    nodes.push({ id: 'approval', type: 'approval', position: { x: cx - 150, y }, data: { label: 'Approval Gate', status: 'idle' } });
    const policySource = spec.hasPolicy ? 'policy' : 'proposal';
    edges.push({ id: 'e-to-approval', source: policySource, target: 'approval' });
  }

  // Dispatch
  nodes.push({ id: 'dispatch', type: 'dispatch', position: { x: cx + (spec.hasApproval ? 150 : 0), y }, data: { label: 'Dispatch', status: 'idle' } });
  const dispatchSource = spec.hasPolicy ? 'policy' : 'proposal';
  edges.push({ id: 'e-to-dispatch', source: dispatchSource, target: 'dispatch' });

  y += 100;

  // Tool execution nodes — one per tool (max 8 visible, rest grouped)
  const toolsToShow = spec.tools.slice(0, 8);
  const hasMore = spec.tools.length > 8;
  const toolWidth = Math.min(180, 600 / Math.max(toolsToShow.length, 1));
  const totalWidth = toolsToShow.length * toolWidth;
  const startX = cx - totalWidth / 2 + toolWidth / 2;

  if (toolsToShow.length > 0) {
    toolsToShow.forEach((tool, i) => {
      const toolId = `tool_${i}`;
      const toolName = tool.tool_ref.split('/').pop() ?? tool.tool_ref;
      nodes.push({
        id: toolId,
        type: 'execution',
        position: { x: startX + i * toolWidth, y },
        data: { label: toolName, status: 'idle', detail: tool.tool_ref },
      });
      edges.push({ id: `e-dispatch-${toolId}`, source: 'dispatch', target: toolId });
    });

    if (hasMore) {
      const moreId = 'tool_more';
      nodes.push({
        id: moreId,
        type: 'execution',
        position: { x: startX + toolsToShow.length * toolWidth, y },
        data: { label: `+${spec.tools.length - 8} more`, status: 'idle' },
      });
      edges.push({ id: `e-dispatch-${moreId}`, source: 'dispatch', target: moreId });
    }
  } else {
    // No tools — single execution node
    nodes.push({ id: 'execution', type: 'execution', position: { x: cx, y }, data: { label: 'Tool Execution', status: 'idle' } });
    edges.push({ id: 'e-dispatch-exec', source: 'dispatch', target: 'execution' });
  }

  y += 100;

  // Result collection
  nodes.push({ id: 'result', type: 'result', position: { x: cx, y }, data: { label: 'Result Collection', status: 'idle' } });
  if (toolsToShow.length > 0) {
    toolsToShow.forEach((_, i) => {
      edges.push({ id: `e-tool${i}-result`, source: `tool_${i}`, target: 'result' });
    });
    if (hasMore) edges.push({ id: 'e-toolmore-result', source: 'tool_more', target: 'result' });
  } else {
    edges.push({ id: 'e-exec-result', source: 'execution', target: 'result' });
  }

  y += 100;

  // Learning + Replan
  if (spec.hasMemory) {
    nodes.push({ id: 'learn', type: 'learn', position: { x: cx - 150, y }, data: { label: 'Memory Learning', status: 'idle' } });
    edges.push({ id: 'e-result-learn', source: 'result', target: 'learn' });
  }

  nodes.push({ id: 'replan', type: 'replan', position: { x: cx + 150, y }, data: { label: 'Replan', status: 'idle' } });
  edges.push({ id: 'e-result-replan', source: 'result', target: 'replan' });
  edges.push({
    id: 'e-replan-prop',
    source: 'replan',
    target: 'proposal',
    animated: true,
    style: { strokeDasharray: '5 5', stroke: '#d97706' },
  });

  return { nodes, edges };
}

function buildDefaultGraph(): { nodes: Node[]; edges: Edge[] } {
  return buildGraphFromSpec({
    tools: [],
    hasPolicy: true,
    hasApproval: true,
    hasScoring: true,
    hasMemory: true,
  });
}

interface AgentGraphProps {
  className?: string;
}

export default function AgentGraph({ className }: AgentGraphProps) {
  const tools = useSpecStore((s) => s.tools);
  const policy = useSpecStore((s) => s.policy);
  const scoring = useSpecStore((s) => s.scoring);
  const goal = useSpecStore((s) => s.goal);

  const { nodes: generatedNodes, edges: generatedEdges } = useMemo(() => {
    const hasSpec = goal.length > 0 || tools.length > 0;
    if (!hasSpec) return buildDefaultGraph();

    return buildGraphFromSpec({
      tools,
      hasPolicy: (policy.require_approval_for?.length ?? 0) > 0 || (policy.escalation_rules?.length ?? 0) > 0,
      hasApproval: policy.auto_approve_threshold < 1.0,
      hasScoring: Boolean(scoring.strategy),
      hasMemory: true,
    });
  }, [tools, policy, scoring, goal]);

  const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);
  const setInspectorItem = useExecutionStore((s) => s.setInspectorItem);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setInspectorItem({
      type: 'node',
      id: node.id,
      name: (node.data as any).label,
      data: node.data as Record<string, unknown>,
    });
  }, [setInspectorItem]);

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
        <Controls position="top-right" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          nodeColor={(n) => {
            const status = (n.data as any)?.status;
            if (status === 'running') return '#3b82f6';
            if (status === 'completed') return '#22c55e';
            if (status === 'failed') return '#ef4444';
            return '#d1d5db';
          }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  );
}
