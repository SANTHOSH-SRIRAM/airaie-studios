// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { ArtifactLineageNode, ArtifactLineageEdge } from '@/types/analytics';

// --- Mock data ---

const mockNodes: ArtifactLineageNode[] = [
  { id: 'in-1', type: 'input', name: 'mesh.stl', hash: 'abcdef1234567890' },
  { id: 'tool-1', type: 'tool', name: 'fea-solver' },
  { id: 'out-1', type: 'output', name: 'results.vtp', hash: 'deadbeef12345678' },
];

const mockEdges: ArtifactLineageEdge[] = [
  { source: 'in-1', target: 'tool-1', label: 'input' },
  { source: 'tool-1', target: 'out-1', label: 'output' },
];

// --- Mock @xyflow/react ---

vi.mock('@xyflow/react', () => {
  const Position = { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' };
  return {
    ReactFlow: ({ nodes, edges, nodeTypes, children }: any) => (
      <div data-testid="reactflow" data-node-count={nodes?.length ?? 0} data-edge-count={edges?.length ?? 0}>
        {nodes?.map((node: any) => {
          const NodeComponent = nodeTypes?.[node.type];
          return NodeComponent ? (
            <div key={node.id} data-testid={`node-${node.id}`}>
              <NodeComponent data={node.data} />
            </div>
          ) : null;
        })}
        {children}
      </div>
    ),
    Controls: () => <div data-testid="rf-controls" />,
    Background: () => <div data-testid="rf-background" />,
    Handle: ({ type, position }: any) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
    Position,
    BackgroundVariant: { Dots: 'dots' },
    useReactFlow: () => ({ fitView: vi.fn() }),
  };
});

// Mock dagre
vi.mock('dagre', () => {
  const graphInstance: any = {
    setGraph: vi.fn(),
    setNode: vi.fn(),
    setEdge: vi.fn(),
    node: (_id: string) => ({ x: 100, y: 100 }),
  };
  graphInstance.setDefaultEdgeLabel = vi.fn(() => graphInstance);

  function GraphConstructor(this: any) {
    return graphInstance;
  }

  return {
    default: {
      graphlib: { Graph: GraphConstructor },
      layout: vi.fn(),
    },
  };
});

// Mock @airaie/ui
vi.mock('@airaie/ui', () => ({
  Spinner: () => <div data-testid="spinner" />,
}));

// Mock the useArtifactLineage hook
const mockUseArtifactLineage = vi.fn();
vi.mock('@hooks/useArtifactLineage', () => ({
  useArtifactLineage: (...args: any[]) => mockUseArtifactLineage(...args),
}));

// --- Tests ---

describe('LineageDAGViewer', () => {
  let LineageDAGViewer: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseArtifactLineage.mockReturnValue({
      data: { nodes: mockNodes, edges: mockEdges },
      isLoading: false,
    });
    const mod = await import('@components/studio/LineageDAGViewer');
    LineageDAGViewer = mod.default;
  });

  it('renders input, tool, and output nodes with distinct styling', () => {
    render(<LineageDAGViewer artifactId="art-1" />);
    // Should have 3 nodes
    const rf = screen.getByTestId('reactflow');
    expect(rf.getAttribute('data-node-count')).toBe('3');
    // Input node should show file name
    expect(screen.getByText('mesh.stl')).toBeDefined();
    // Tool node should show tool name
    expect(screen.getByText('fea-solver')).toBeDefined();
    // Output node should show file name
    expect(screen.getByText('results.vtp')).toBeDefined();
  });

  it('shows content hash on artifact nodes (truncated 8 chars)', () => {
    render(<LineageDAGViewer artifactId="art-1" />);
    // Input hash: abcdef1234567890 -> truncated to abcdef12
    expect(screen.getByText('abcdef12')).toBeDefined();
    // Output hash: deadbeef12345678 -> truncated to deadbeef
    expect(screen.getByText('deadbeef')).toBeDefined();
  });

  it('highlights a specific artifact path when highlightId prop is set', () => {
    const { container } = render(<LineageDAGViewer artifactId="art-1" highlightId="in-1" />);
    // The highlighted node should have a yellow ring
    const highlightedNode = screen.getByTestId('node-in-1');
    expect(highlightedNode.querySelector('.ring-yellow-400')).toBeDefined();
    // Non-highlighted nodes should have opacity-40
    const dimmedNode = screen.getByTestId('node-tool-1');
    expect(dimmedNode.querySelector('.opacity-40')).toBeDefined();
  });

  it('shows empty state when no lineage data', () => {
    mockUseArtifactLineage.mockReturnValue({
      data: { nodes: [], edges: [] },
      isLoading: false,
    });
    render(<LineageDAGViewer artifactId="art-1" />);
    expect(screen.getByText('No lineage data available')).toBeDefined();
  });

  it('renders edges between nodes', () => {
    render(<LineageDAGViewer artifactId="art-1" />);
    const rf = screen.getByTestId('reactflow');
    expect(rf.getAttribute('data-edge-count')).toBe('2');
  });
});
