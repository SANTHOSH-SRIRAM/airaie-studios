import React, { useMemo } from 'react';
import { cn, Badge, Button } from '@airaie/ui';
import { formatCost } from '@airaie/ui';
import { Check, X, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ActionProposal, ProposedAction, ActionDependency } from '@airaie/shared';
import ProposalActionCard from './ProposalActionCard';

export interface ProposalViewerProps {
  proposal: ActionProposal;
  onApproveAll?: () => void;
  onReject?: () => void;
  isPending?: boolean;
  className?: string;
}

// Layout constants for the dependency DAG
const NODE_W = 120;
const NODE_H = 36;
const GAP_X = 40;
const GAP_Y = 24;
const PAD = 16;

interface LayoutNode {
  id: string;
  col: number;
  row: number;
  x: number;
  y: number;
  action: ProposedAction;
}

/** Compute a simple topological layout for the dependency DAG. */
function layoutDag(actions: ProposedAction[], deps: ActionDependency[]) {
  const depMap = new Map<string, string[]>();
  deps.forEach((d) => depMap.set(d.action_id, d.depends_on));

  // Topological sort by layers (BFS)
  const inDegree = new Map<string, number>();
  actions.forEach((a) => inDegree.set(a.action_id, 0));
  deps.forEach((d) => {
    d.depends_on.forEach((dep) => {
      if (inDegree.has(d.action_id)) {
        inDegree.set(d.action_id, (inDegree.get(d.action_id) ?? 0) + 1);
      }
    });
  });

  const layers: string[][] = [];
  const placed = new Set<string>();
  let remaining = new Set(actions.map((a) => a.action_id));

  while (remaining.size > 0) {
    const layer: string[] = [];
    for (const id of remaining) {
      const predecessors = depMap.get(id) ?? [];
      if (predecessors.every((p) => placed.has(p))) {
        layer.push(id);
      }
    }
    if (layer.length === 0) {
      // Cycle or disconnected — dump remaining
      layer.push(...remaining);
      remaining = new Set();
    } else {
      layer.forEach((id) => {
        placed.add(id);
        remaining.delete(id);
      });
    }
    layers.push(layer);
  }

  const actionMap = new Map(actions.map((a) => [a.action_id, a]));
  const nodes: LayoutNode[] = [];

  layers.forEach((layer, col) => {
    layer.forEach((id, row) => {
      const action = actionMap.get(id);
      if (!action) return;
      nodes.push({
        id,
        col,
        row,
        x: PAD + col * (NODE_W + GAP_X),
        y: PAD + row * (NODE_H + GAP_Y),
        action,
      });
    });
  });

  return { nodes, layers, depMap };
}

/** Policy verdict badge for an action. */
function PolicyBadge({ action }: { action: ProposedAction }) {
  if (action.requires_approval) {
    return (
      <Badge variant="warning" badgeStyle="filled" className="gap-0.5">
        <AlertTriangle size={10} />
        needs_approval
      </Badge>
    );
  }
  if (action.scoring.final_score >= 0.7) {
    return (
      <Badge variant="success" badgeStyle="outline" className="gap-0.5">
        <ShieldCheck size={10} />
        approved
      </Badge>
    );
  }
  return (
    <Badge variant="danger" badgeStyle="outline" className="gap-0.5">
      <ShieldOff size={10} />
      blocked
    </Badge>
  );
}

const ProposalViewer: React.FC<ProposalViewerProps> = ({
  proposal,
  onApproveAll,
  onReject,
  isPending = false,
  className,
}) => {
  const { nodes, depMap } = useMemo(
    () => layoutDag(proposal.actions, proposal.dependencies),
    [proposal.actions, proposal.dependencies]
  );

  const maxCol = Math.max(...nodes.map((n) => n.col), 0);
  const maxRow = Math.max(...nodes.map((n) => n.row), 0);
  const svgW = PAD * 2 + (maxCol + 1) * NODE_W + maxCol * GAP_X;
  const svgH = PAD * 2 + (maxRow + 1) * NODE_H + maxRow * GAP_Y;
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Build edge list
  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  for (const [id, predecessors] of depMap) {
    const toNode = nodeById.get(id);
    if (!toNode) continue;
    for (const predId of predecessors) {
      const fromNode = nodeById.get(predId);
      if (fromNode) edges.push({ from: fromNode, to: toNode });
    }
  }

  return (
    <div className={cn('flex flex-col h-full overflow-hidden bg-white', className)}>
      {/* Header: Goal + summary */}
      <div className="px-4 py-3 border-b border-surface-border space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-content-primary truncate flex-1">{proposal.goal}</h3>
          <Badge variant="info" badgeStyle="outline">{proposal.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-content-tertiary">
          <span>{proposal.actions.length} actions</span>
          <span>Score: {proposal.total_score.toFixed(2)}</span>
          <span>Est. cost: {formatCost(proposal.estimated_cost)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Dependency DAG visualization */}
        {nodes.length > 1 && (
          <div className="px-4 py-3 border-b border-surface-border">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider mb-2 block">
              Dependency Graph
            </span>
            <div className="overflow-x-auto">
              <svg width={svgW} height={svgH} className="text-content-secondary">
                <defs>
                  <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" className="fill-content-muted" />
                  </marker>
                </defs>

                {/* Edges */}
                {edges.map(({ from, to }, i) => {
                  const x1 = from.x + NODE_W;
                  const y1 = from.y + NODE_H / 2;
                  const x2 = to.x;
                  const y2 = to.y + NODE_H / 2;
                  const mx = (x1 + x2) / 2;
                  return (
                    <path
                      key={i}
                      d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      opacity={0.4}
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                  <g key={node.id}>
                    <rect
                      x={node.x}
                      y={node.y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={4}
                      className={cn(
                        'stroke-surface-border',
                        node.action.requires_approval
                          ? 'fill-amber-50'
                          : node.action.scoring.final_score >= 0.7
                            ? 'fill-emerald-50'
                            : 'fill-red-50'
                      )}
                      strokeWidth={1}
                    />
                    <text
                      x={node.x + NODE_W / 2}
                      y={node.y + NODE_H / 2 + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-content-primary text-[10px] font-mono"
                    >
                      {node.action.tool_ref.length > 16
                        ? node.action.tool_ref.slice(0, 14) + '...'
                        : node.action.tool_ref}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* Action cards with policy badges */}
        <div className="p-4 space-y-3">
          <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            Actions ({proposal.actions.length})
          </span>
          {proposal.actions
            .sort((a, b) => a.order - b.order)
            .map((action) => (
              <div key={action.action_id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <PolicyBadge action={action} />
                  <span className="text-xs text-content-muted">
                    confidence: {action.scoring.final_score.toFixed(2)}
                  </span>
                </div>
                <ProposalActionCard action={action} />
              </div>
            ))}
        </div>

        {/* Constraints summary */}
        <div className="px-4 pb-4">
          <div className="border border-surface-border p-3 space-y-2">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
              Constraints
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-content-secondary">
              <span>Tools: {proposal.constraints.tools_selected}/{proposal.constraints.max_tools_per_run}</span>
              <span>Budget: {formatCost(proposal.constraints.budget_used)}/{formatCost(proposal.constraints.budget_limit)}</span>
              <span>Timeout: {proposal.constraints.timeout_seconds}s</span>
              <span>Retries: {proposal.constraints.max_retries}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: approve/reject */}
      {proposal.status === 'draft' && (onApproveAll || onReject) && (
        <div className="px-4 py-3 border-t border-surface-border bg-white flex gap-2">
          {onApproveAll && (
            <Button variant="primary" size="sm" icon={Check} className="flex-1" onClick={onApproveAll} loading={isPending}>
              Approve All
            </Button>
          )}
          {onReject && (
            <Button variant="outline" size="sm" icon={X} className="flex-1" onClick={onReject}>
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

ProposalViewer.displayName = 'ProposalViewer';

export default ProposalViewer;
