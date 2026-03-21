// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { PlanStep } from '@/types/board';

// Mock @xyflow/react — ReactFlow is hard to unit test with jsdom
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
  function MockGraph() {
    return {
      setDefaultEdgeLabel: vi.fn().mockReturnThis(),
      setGraph: vi.fn(),
      setNode: vi.fn(),
      setEdge: vi.fn(),
      node: (_id: string) => ({ x: 100, y: 100 }),
    };
  }
  // Make it work as a constructor (new Dagre.graphlib.Graph())
  const graphInstance = new (MockGraph as any)();
  // Return the same instance from constructor-like call
  function GraphConstructor() {
    return graphInstance;
  }
  // setDefaultEdgeLabel returns `this` (the graph)
  graphInstance.setDefaultEdgeLabel = vi.fn(() => graphInstance);

  return {
    default: {
      graphlib: {
        Graph: GraphConstructor,
      },
      layout: vi.fn(),
    },
  };
});

// Mock @airaie/ui
vi.mock('@airaie/ui', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
  Spinner: () => <div data-testid="spinner" />,
}));

// --- Fixtures ---

const mockSteps: PlanStep[] = [
  {
    id: 'step-1',
    tool_name: 'mesh-generator',
    tool_version: '1.0.0',
    role: 'preprocess',
    status: 'completed',
    parameters: { mesh_size: 1000 },
    depends_on: [],
  },
  {
    id: 'step-2',
    tool_name: 'fea-solver',
    tool_version: '2.1.0',
    role: 'solve',
    status: 'running',
    parameters: { solver_type: 'direct' },
    depends_on: ['step-1'],
    progress: 65,
    duration_ms: 12500,
  },
  {
    id: 'step-3',
    tool_name: 'report-gen',
    tool_version: '1.2.0',
    role: 'report',
    status: 'pending',
    parameters: {},
    depends_on: ['step-2'],
  },
  {
    id: 'step-4',
    tool_name: 'failed-tool',
    tool_version: '0.5.0',
    role: 'postprocess',
    status: 'failed',
    parameters: {},
    depends_on: ['step-1'],
    error: 'Out of memory',
  },
];

const mockPlan = {
  id: 'plan-1',
  card_id: 'card-1',
  status: 'executing' as const,
  steps: mockSteps,
  cost_estimate: '0.50',
  time_estimate: '10m',
};

const mockExecStatus = {
  plan_id: 'plan-1',
  status: 'executing' as const,
  steps: mockSteps.map((s) => ({ id: s.id, tool_name: s.tool_name, status: s.status })),
  completed_steps: 1,
  total_steps: 4,
};

// --- PlanDAGNode tests ---

describe('PlanDAGNode', () => {
  let PlanDAGNode: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/PlanDAGNode');
    PlanDAGNode = mod.default;
  });

  it('renders tool name and version', () => {
    render(<PlanDAGNode data={{ step: mockSteps[0] }} />);
    expect(screen.getByText('mesh-generator')).toBeDefined();
    expect(screen.getByText('v1.0.0')).toBeDefined();
  });

  it('renders left/right handles for LR layout', () => {
    render(<PlanDAGNode data={{ step: mockSteps[0] }} />);
    expect(screen.getByTestId('handle-target-left')).toBeDefined();
    expect(screen.getByTestId('handle-source-right')).toBeDefined();
  });

  it('shows animate-pulse class for running status', () => {
    const { container } = render(<PlanDAGNode data={{ step: mockSteps[1] }} />);
    const nodeEl = container.firstChild as HTMLElement;
    expect(nodeEl.className).toContain('animate-pulse');
  });

  it('shows green border for completed status', () => {
    const { container } = render(<PlanDAGNode data={{ step: mockSteps[0] }} />);
    const nodeEl = container.firstChild as HTMLElement;
    expect(nodeEl.className).toContain('border-green-500');
  });

  it('shows red border for failed status', () => {
    const { container } = render(<PlanDAGNode data={{ step: mockSteps[3] }} />);
    const nodeEl = container.firstChild as HTMLElement;
    expect(nodeEl.className).toContain('border-red-500');
  });

  it('shows progress percentage when running with progress > 0', () => {
    render(<PlanDAGNode data={{ step: mockSteps[1] }} />);
    expect(screen.getByText('65%')).toBeDefined();
  });

  it('does not show progress for non-running status', () => {
    render(<PlanDAGNode data={{ step: mockSteps[0] }} />);
    expect(screen.queryByText('%')).toBeNull();
  });
});

// --- PlanNodeDetail tests ---

describe('PlanNodeDetail', () => {
  let PlanNodeDetail: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/PlanNodeDetail');
    PlanNodeDetail = mod.default;
  });

  it('renders tool name and version', () => {
    render(<PlanNodeDetail step={mockSteps[0]} onClose={vi.fn()} />);
    expect(screen.getByText('mesh-generator')).toBeDefined();
    expect(screen.getByText('v1.0.0')).toBeDefined();
  });

  it('renders close button', () => {
    const onClose = vi.fn();
    render(<PlanNodeDetail step={mockSteps[0]} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders parameter entries', () => {
    render(<PlanNodeDetail step={mockSteps[0]} onClose={vi.fn()} />);
    expect(screen.getByText('mesh_size:')).toBeDefined();
    expect(screen.getByText('1000')).toBeDefined();
  });

  it('shows duration when available', () => {
    render(<PlanNodeDetail step={mockSteps[1]} onClose={vi.fn()} />);
    expect(screen.getByText('12.5s')).toBeDefined();
  });

  it('shows error message for failed steps', () => {
    render(<PlanNodeDetail step={mockSteps[3]} onClose={vi.fn()} />);
    expect(screen.getByText('Out of memory')).toBeDefined();
  });
});

// --- PlanDAGViewer tests ---

describe('PlanDAGViewer', () => {
  let PlanDAGViewer: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/PlanDAGViewer');
    PlanDAGViewer = mod.default;
  });

  it('renders ReactFlow with correct number of nodes', () => {
    render(
      <PlanDAGViewer plan={mockPlan} isExecuting={true} execStatus={mockExecStatus} />
    );
    const rf = screen.getByTestId('reactflow');
    expect(rf.getAttribute('data-node-count')).toBe('4');
  });

  it('renders correct number of edges from depends_on', () => {
    render(
      <PlanDAGViewer plan={mockPlan} isExecuting={true} execStatus={mockExecStatus} />
    );
    const rf = screen.getByTestId('reactflow');
    // step-2 depends on step-1, step-3 depends on step-2, step-4 depends on step-1 = 3 edges
    expect(rf.getAttribute('data-edge-count')).toBe('3');
  });

  it('renders node data with progress for running steps', () => {
    render(
      <PlanDAGViewer plan={mockPlan} isExecuting={true} execStatus={mockExecStatus} />
    );
    // Running node should show progress percentage
    expect(screen.getByText('65%')).toBeDefined();
  });

  it('renders controls and background', () => {
    render(
      <PlanDAGViewer plan={mockPlan} isExecuting={false} />
    );
    expect(screen.getByTestId('rf-controls')).toBeDefined();
    expect(screen.getByTestId('rf-background')).toBeDefined();
  });

  it('shows detail panel when node is clicked', () => {
    render(
      <PlanDAGViewer plan={mockPlan} isExecuting={false} />
    );
    // Click on the first node
    const node = screen.getByTestId('node-step-1');
    fireEvent.click(node);
    // PlanNodeDetail should now be visible with step details
    expect(screen.getAllByText('mesh-generator').length).toBeGreaterThanOrEqual(2); // one in node, one in detail
  });
});
