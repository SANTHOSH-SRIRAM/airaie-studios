import React, { useMemo } from 'react';
import { cn, Spinner } from '@airaie/ui';
import { useArtifactLineage } from '@hooks/useArtifacts';
import type { KernelArtifactLineage } from '@airaie/shared';
import LineageNode from './LineageNode';

export interface LineageGraphProps {
  artifactId: string;
  onSelectArtifact: (id: string) => void;
  className?: string;
}

const NODE_W = 120;
const NODE_H = 50;
const COL_GAP = 180;
const ROW_GAP = 80;
const PAD = 40;

interface NodeInfo {
  id: string;
  label: string;
  depth: number;
}

function buildGraph(edges: KernelArtifactLineage[], rootId: string) {
  const labels = new Map<string, string>();
  const children = new Map<string, Set<string>>();
  const parents = new Map<string, Set<string>>();

  for (const edge of edges) {
    const src = edge.input_artifact;
    const dst = edge.output_artifact;

    if (!labels.has(src)) labels.set(src, src.slice(0, 12));
    if (!labels.has(dst)) labels.set(dst, dst.slice(0, 12));

    if (!children.has(src)) children.set(src, new Set());
    children.get(src)!.add(dst);

    if (!parents.has(dst)) parents.set(dst, new Set());
    parents.get(dst)!.add(src);
  }

  // BFS from roots (nodes with no parents) to compute depth
  const allIds = new Set(labels.keys());
  const roots = [...allIds].filter((id) => !parents.has(id) || parents.get(id)!.size === 0);
  if (roots.length === 0 && allIds.size > 0) roots.push(rootId);

  const depth = new Map<string, number>();
  const queue = roots.map((id) => {
    depth.set(id, 0);
    return id;
  });

  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = depth.get(cur)!;
    for (const child of children.get(cur) ?? []) {
      const existing = depth.get(child) ?? -1;
      if (d + 1 > existing) {
        depth.set(child, d + 1);
        queue.push(child);
      }
    }
  }

  // Ensure all nodes have a depth
  for (const id of allIds) {
    if (!depth.has(id)) depth.set(id, 0);
  }

  const nodes: NodeInfo[] = [...allIds].map((id) => ({
    id,
    label: labels.get(id)!,
    depth: depth.get(id)!,
  }));

  return { nodes, edges };
}

const LineageGraph: React.FC<LineageGraphProps> = ({ artifactId, onSelectArtifact, className }) => {
  const { data: lineage, isLoading } = useArtifactLineage(artifactId);

  const { nodes, positions, svgWidth, svgHeight, edgeLines } = useMemo(() => {
    if (!lineage || lineage.length === 0) {
      return { nodes: [], positions: new Map(), svgWidth: 0, svgHeight: 0, edgeLines: [] };
    }

    const { nodes, edges } = buildGraph(lineage, artifactId);

    // Group nodes by depth for column layout
    const columns = new Map<number, NodeInfo[]>();
    for (const n of nodes) {
      if (!columns.has(n.depth)) columns.set(n.depth, []);
      columns.get(n.depth)!.push(n);
    }

    const maxDepth = Math.max(...nodes.map((n) => n.depth));
    const maxColSize = Math.max(...[...columns.values()].map((c) => c.length));

    const positions = new Map<string, { x: number; y: number }>();
    for (const [col, group] of columns) {
      group.forEach((node, row) => {
        positions.set(node.id, {
          x: PAD + col * COL_GAP,
          y: PAD + row * ROW_GAP,
        });
      });
    }

    const edgeLines = edges.map((e) => {
      const from = positions.get(e.input_artifact);
      const to = positions.get(e.output_artifact);
      return from && to
        ? {
            x1: from.x + NODE_W,
            y1: from.y + NODE_H / 2,
            x2: to.x,
            y2: to.y + NODE_H / 2,
            transform: e.transform ?? '',
          }
        : null;
    }).filter(Boolean) as { x1: number; y1: number; x2: number; y2: number; transform: string }[];

    return {
      nodes,
      positions,
      svgWidth: PAD * 2 + maxDepth * COL_GAP + NODE_W,
      svgHeight: PAD * 2 + (maxColSize - 1) * ROW_GAP + NODE_H,
      edgeLines,
    };
  }, [lineage, artifactId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!lineage || lineage.length === 0) {
    return (
      <p className="text-sm text-content-tertiary py-8 text-center">
        No lineage data available for this artifact.
      </p>
    );
  }

  return (
    <div className={cn('overflow-auto border border-surface-border bg-surface', className)}>
      <svg width={svgWidth} height={svgHeight}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" className="fill-content-tertiary" />
          </marker>
        </defs>

        {edgeLines.map((edge, i) => (
          <g key={i}>
            <path
              d={`M${edge.x1},${edge.y1} C${edge.x1 + 40},${edge.y1} ${edge.x2 - 40},${edge.y2} ${edge.x2},${edge.y2}`}
              fill="none"
              className="stroke-content-tertiary"
              strokeWidth={1}
              markerEnd="url(#arrowhead)"
            />
            {edge.transform && (
              <text
                x={(edge.x1 + edge.x2) / 2}
                y={(edge.y1 + edge.y2) / 2 - 6}
                textAnchor="middle"
                className="text-[10px] fill-content-tertiary"
              >
                {edge.transform}
              </text>
            )}
          </g>
        ))}

        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          return (
            <LineageNode
              key={node.id}
              id={node.id}
              label={node.label}
              x={pos.x}
              y={pos.y}
              isActive={node.id === artifactId}
              onClick={() => onSelectArtifact(node.id)}
            />
          );
        })}
      </svg>
    </div>
  );
};

LineageGraph.displayName = 'LineageGraph';

export default LineageGraph;
