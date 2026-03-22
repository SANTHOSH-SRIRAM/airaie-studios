// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { Card } from '@/types/board';

// Mock @xyflow/react
vi.mock('@xyflow/react', () => {
  const Position = { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' };
  return {
    ReactFlow: ({ nodes, edges, nodeTypes, onNodeClick, children }: any) => (
      <div data-testid="reactflow" data-node-count={nodes?.length ?? 0} data-edge-count={edges?.length ?? 0}>
        {nodes?.map((node: any) => {
          const NodeComponent = nodeTypes?.[node.type];
          return NodeComponent ? (
            <div key={node.id} data-testid={`node-${node.id}`} onClick={(e) => onNodeClick?.(e, node)}>
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
  const graphInstance = {
    setDefaultEdgeLabel: vi.fn(function (this: any) { return this; }),
    setGraph: vi.fn(),
    setNode: vi.fn(),
    setEdge: vi.fn(),
    node: (_id: string) => ({ x: 100, y: 100 }),
  };
  // Bind setDefaultEdgeLabel to return graphInstance
  graphInstance.setDefaultEdgeLabel = vi.fn(() => graphInstance);

  function GraphConstructor() {
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
  Badge: ({ children, variant, dot }: any) => (
    <span data-testid="badge" data-variant={variant} data-dot={dot ? 'true' : undefined}>{children}</span>
  ),
  Spinner: () => <div data-testid="spinner" />,
}));

// --- Fixtures ---

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'card-1',
  board_id: 'board-1',
  name: 'FEA Analysis',
  type: 'analysis',
  status: 'completed',
  ordinal: 0,
  config: {},
  kpis: {},
  dependencies: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockCards: Card[] = [
  makeCard({ id: 'card-1', name: 'Mesh Generation', type: 'analysis', status: 'completed', dependencies: [] }),
  makeCard({ id: 'card-2', name: 'FEA Solver Run', type: 'analysis', status: 'running', dependencies: ['card-1'] }),
  makeCard({ id: 'card-3', name: 'Report Generation', type: 'comparison', status: 'draft', dependencies: ['card-2'] }),
  makeCard({ id: 'card-4', name: 'Failed Validation', type: 'gate', status: 'failed', dependencies: ['card-1'] }),
];

// --- Tests ---

describe('CardDependencyDAG', () => {
  let CardDependencyDAG: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/CardDependencyDAG');
    CardDependencyDAG = mod.default;
  });

  it('renders a node for each card in the graph', () => {
    render(<CardDependencyDAG cards={mockCards} />);
    const rf = screen.getByTestId('reactflow');
    expect(rf.getAttribute('data-node-count')).toBe('4');
  });

  it('nodes display card name, type badge, and status badge', () => {
    render(<CardDependencyDAG cards={mockCards} />);
    expect(screen.getByText('Mesh Generation')).toBeDefined();
    // Type badge and status badge rendered as Badge components
    const badges = screen.getAllByTestId('badge');
    // At least 2 badges per node (type + status) = 8 total
    expect(badges.length).toBeGreaterThanOrEqual(8);
  });

  it('renders edges based on depends_on relationships', () => {
    render(<CardDependencyDAG cards={mockCards} />);
    const rf = screen.getByTestId('reactflow');
    // card-2 -> card-1, card-3 -> card-2, card-4 -> card-1 = 3 edges
    expect(rf.getAttribute('data-edge-count')).toBe('3');
  });

  it('calls onNodeClick with card id when node clicked', () => {
    const onNodeClick = vi.fn();
    render(<CardDependencyDAG cards={mockCards} onNodeClick={onNodeClick} />);
    const node = screen.getByTestId('node-card-1');
    fireEvent.click(node);
    expect(onNodeClick).toHaveBeenCalledWith('card-1');
  });
});
