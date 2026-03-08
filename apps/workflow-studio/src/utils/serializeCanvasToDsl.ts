import type { CanvasNode, CanvasEdge } from '@store/canvasStore';

/** Convert a display name to a valid DSL identifier (lowercase, hyphens). */
export function toIdentifier(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/^[^a-z]/, 'w')
    .replace(/-+/g, '-')
    .slice(0, 64) || 'untitled-workflow';
}

/** Serialize canvas nodes + edges into a workflow DSL object. */
export function serializeCanvasToDsl(
  nodes: Map<string, CanvasNode>,
  edges: Map<string, CanvasEdge>,
  workflowName?: string,
): Record<string, unknown> {
  const dslNodes = Array.from(nodes.values()).map((n) => ({
    id: n.id,
    tool: n.toolRef ?? `${n.type}@1.0.0`,
    inputs: n.config,
    depends_on: Array.from(edges.values())
      .filter((e) => e.targetNodeId === n.id)
      .map((e) => e.sourceNodeId),
  }));

  const name = workflowName || 'Untitled Workflow';

  return {
    api_version: 'airaie.workflow/v1',
    kind: 'Workflow',
    metadata: { name: toIdentifier(name), version: 1 },
    nodes: dslNodes,
  };
}
