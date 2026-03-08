/**
 * Canvas→DSL Serialization Tests
 *
 * Validates that serializeCanvasToDsl produces output matching
 * the backend parser expectations (airaie-kernel/internal/workflow/parser.go):
 *
 * - api_version must be "airaie.workflow/v1"
 * - kind must be "Workflow"
 * - metadata.name must match /^[a-z][a-z0-9_-]{0,63}$/
 * - metadata.version must be >= 1
 * - nodes[].tool must be name@version format
 * - nodes[].id is a string
 * - nodes[].depends_on is an array of node IDs
 *
 * Run with: npx vitest run src/utils/serializeCanvasToDsl.test.ts
 *   or:     npx tsx --test src/utils/serializeCanvasToDsl.test.ts
 */

import { describe, it, expect } from 'vitest';
import { serializeCanvasToDsl, toIdentifier } from './serializeCanvasToDsl';
import type { CanvasNode, CanvasEdge } from '../store/canvasStore';

// Backend identifier regex from parser.go
const IDENTIFIER_RE = /^[a-z][a-z0-9_-]{0,63}$/;
// Backend tool format regex
const TOOL_FORMAT_RE = /^[a-z][a-z0-9._-]+@\d+\.\d+\.\d+$/;

function makeNode(overrides: Partial<CanvasNode> & { id: string }): CanvasNode {
  return {
    type: 'board',
    label: 'Test Node',
    x: 0,
    y: 0,
    config: {},
    ...overrides,
  };
}

function makeEdge(overrides: Partial<CanvasEdge> & { id: string; sourceNodeId: string; targetNodeId: string }): CanvasEdge {
  return {
    sourcePort: 'out',
    targetPort: 'in',
    ...overrides,
  };
}

describe('toIdentifier', () => {
  it('converts display names to valid DSL identifiers', () => {
    expect(toIdentifier('My Workflow')).toBe('my-workflow');
    expect(toIdentifier('Hello World!')).toBe('hello-world-');
    expect(toIdentifier('UPPERCASE')).toBe('uppercase');
  });

  it('ensures identifier starts with a letter', () => {
    expect(toIdentifier('123-workflow')).toMatch(/^[a-z]/);
  });

  it('collapses multiple hyphens', () => {
    expect(toIdentifier('a   b   c')).toBe('a-b-c');
  });

  it('returns default for empty string', () => {
    expect(toIdentifier('')).toBe('untitled-workflow');
  });

  it('truncates to 64 characters', () => {
    const long = 'a'.repeat(100);
    expect(toIdentifier(long).length).toBeLessThanOrEqual(64);
  });

  it('always matches backend identifier regex', () => {
    const names = ['My Workflow', 'Test 123', 'hello-world', 'CAPS', 'a_b_c', '---start'];
    for (const name of names) {
      const result = toIdentifier(name);
      expect(result).toMatch(IDENTIFIER_RE);
    }
  });
});

describe('serializeCanvasToDsl', () => {
  it('produces correct api_version', () => {
    const nodes = new Map<string, CanvasNode>();
    const edges = new Map<string, CanvasEdge>();

    const dsl = serializeCanvasToDsl(nodes, edges);
    expect(dsl.api_version).toBe('airaie.workflow/v1');
  });

  it('produces correct kind', () => {
    const dsl = serializeCanvasToDsl(new Map(), new Map());
    expect(dsl.kind).toBe('Workflow');
  });

  it('produces valid metadata', () => {
    const dsl = serializeCanvasToDsl(new Map(), new Map(), 'My Test Workflow');
    const metadata = dsl.metadata as { name: string; version: number };

    expect(metadata.name).toMatch(IDENTIFIER_RE);
    expect(metadata.name).toBe('my-test-workflow');
    expect(metadata.version).toBeGreaterThanOrEqual(1);
  });

  it('serializes nodes with correct tool format', () => {
    const nodes = new Map<string, CanvasNode>();
    nodes.set('n1', makeNode({ id: 'n1', toolRef: 'data.generate@1.0.0' }));
    nodes.set('n2', makeNode({ id: 'n2', type: 'agent' })); // no toolRef — fallback

    const dsl = serializeCanvasToDsl(nodes, new Map());
    const dslNodes = dsl.nodes as Array<{ id: string; tool: string }>;

    expect(dslNodes).toHaveLength(2);

    // Explicit toolRef preserved
    const n1 = dslNodes.find((n) => n.id === 'n1')!;
    expect(n1.tool).toBe('data.generate@1.0.0');

    // Fallback uses type@1.0.0
    const n2 = dslNodes.find((n) => n.id === 'n2')!;
    expect(n2.tool).toBe('agent@1.0.0');
    expect(n2.tool).toContain('@');
  });

  it('resolves depends_on from edges', () => {
    const nodes = new Map<string, CanvasNode>();
    nodes.set('step1', makeNode({ id: 'step1', toolRef: 'tool-a@1.0.0' }));
    nodes.set('step2', makeNode({ id: 'step2', toolRef: 'tool-b@1.0.0' }));

    const edges = new Map<string, CanvasEdge>();
    edges.set('e1', makeEdge({ id: 'e1', sourceNodeId: 'step1', targetNodeId: 'step2' }));

    const dsl = serializeCanvasToDsl(nodes, edges);
    const dslNodes = dsl.nodes as Array<{ id: string; depends_on: string[] }>;

    const step1 = dslNodes.find((n) => n.id === 'step1')!;
    expect(step1.depends_on).toEqual([]);

    const step2 = dslNodes.find((n) => n.id === 'step2')!;
    expect(step2.depends_on).toEqual(['step1']);
  });

  it('passes inputs from node config', () => {
    const nodes = new Map<string, CanvasNode>();
    nodes.set('n1', makeNode({
      id: 'n1',
      toolRef: 'data.generate@1.0.0',
      config: { rows: 100, distribution: 'normal' },
    }));

    const dsl = serializeCanvasToDsl(nodes, new Map());
    const dslNodes = dsl.nodes as Array<{ id: string; inputs: Record<string, unknown> }>;
    const n1 = dslNodes.find((n) => n.id === 'n1')!;
    expect(n1.inputs).toEqual({ rows: 100, distribution: 'normal' });
  });

  it('handles empty canvas gracefully', () => {
    const dsl = serializeCanvasToDsl(new Map(), new Map());
    expect(dsl.nodes).toEqual([]);
    expect(dsl.api_version).toBe('airaie.workflow/v1');
    expect(dsl.kind).toBe('Workflow');
  });
});
