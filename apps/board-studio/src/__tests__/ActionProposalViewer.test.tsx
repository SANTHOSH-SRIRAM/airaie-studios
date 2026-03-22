// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { ActionProposal } from '@/types/governance';

// Mock @xyflow/react
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
  function MockGraph() {
    return {
      setDefaultEdgeLabel: vi.fn().mockReturnThis(),
      setGraph: vi.fn(),
      setNode: vi.fn(),
      setEdge: vi.fn(),
      node: (_id: string) => ({ x: 100, y: 100 }),
    };
  }
  const graphInstance = new (MockGraph as any)();
  graphInstance.setDefaultEdgeLabel = vi.fn(() => graphInstance);

  return {
    default: {
      graphlib: {
        Graph: function GraphConstructor() { return graphInstance; },
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
  Button: ({ children, onClick, disabled, icon: Icon, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid={props['data-testid']}>
      {Icon && <span data-testid="button-icon" />}
      {children}
    </button>
  ),
}));

// --- Fixtures ---

const mockProposal: ActionProposal = {
  id: 'proposal-1',
  card_id: 'card-1',
  agent_id: 'agent-1',
  status: 'pending',
  actions: [
    {
      id: 'action-1',
      tool_name: 'mesh-generator',
      tool_version: '1.0.0',
      description: 'Generate mesh',
      confidence: 0.95,
      approval: 'auto-approved',
      auto_approve_threshold: 0.9,
      depends_on: [],
      parameters: { mesh_size: 1000 },
      estimated_cost: 0.5,
      estimated_duration: '2m',
    },
    {
      id: 'action-2',
      tool_name: 'fea-solver',
      tool_version: '2.1.0',
      description: 'Run FEA analysis',
      confidence: 0.72,
      approval: 'pending',
      auto_approve_threshold: 0.9,
      depends_on: ['action-1'],
      parameters: { solver_type: 'direct' },
      estimated_cost: 2.0,
      estimated_duration: '10m',
    },
    {
      id: 'action-3',
      tool_name: 'report-gen',
      tool_version: '1.2.0',
      description: 'Generate report',
      confidence: 0.88,
      approval: 'pending',
      auto_approve_threshold: 0.9,
      depends_on: ['action-2'],
      parameters: {},
    },
  ],
  created_at: '2026-03-22T10:00:00Z',
  updated_at: '2026-03-22T10:00:00Z',
};

// --- Tests ---

describe('ActionProposalViewer', () => {
  let ActionProposalViewer: any;
  const onApproveAction = vi.fn();
  const onRejectAction = vi.fn();
  const onApproveAll = vi.fn();
  const onRejectAll = vi.fn();
  const onEditConstraints = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@components/studio/ActionProposalViewer');
    ActionProposalViewer = mod.default;
  });

  function renderViewer(proposal = mockProposal) {
    return render(
      <ActionProposalViewer
        proposal={proposal}
        onApproveAction={onApproveAction}
        onRejectAction={onRejectAction}
        onApproveAll={onApproveAll}
        onRejectAll={onRejectAll}
        onEditConstraints={onEditConstraints}
      />
    );
  }

  it('renders without crashing with 3 actions', () => {
    renderViewer();
    const rf = screen.getByTestId('reactflow');
    expect(rf.getAttribute('data-node-count')).toBe('3');
  });

  it('renders correct number of edges from depends_on', () => {
    renderViewer();
    const rf = screen.getByTestId('reactflow');
    // action-2 depends on action-1, action-3 depends on action-2 = 2 edges
    expect(rf.getAttribute('data-edge-count')).toBe('2');
  });

  it('renders bulk action buttons', () => {
    renderViewer();
    expect(screen.getByText('Approve All')).toBeDefined();
    expect(screen.getByText('Reject All')).toBeDefined();
    expect(screen.getByText('Edit Constraints')).toBeDefined();
  });

  it('calls onApproveAll when Approve All is clicked', () => {
    renderViewer();
    fireEvent.click(screen.getByText('Approve All'));
    expect(onApproveAll).toHaveBeenCalledTimes(1);
  });

  it('calls onRejectAll when Reject All is clicked', () => {
    renderViewer();
    fireEvent.click(screen.getByText('Reject All'));
    expect(onRejectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onEditConstraints when Edit Constraints is clicked', () => {
    renderViewer();
    fireEvent.click(screen.getByText('Edit Constraints'));
    expect(onEditConstraints).toHaveBeenCalledTimes(1);
  });

  it('displays summary counts', () => {
    renderViewer();
    // 3 actions, 1 auto-approved, 0 rejected, 2 pending
    expect(screen.getByText(/3 actions/)).toBeDefined();
    expect(screen.getByText(/1 approved/)).toBeDefined();
    expect(screen.getByText(/2 pending/)).toBeDefined();
  });

  it('renders confidence scores on nodes', () => {
    renderViewer();
    // 95% confidence for action-1, 72% for action-2, 88% for action-3
    expect(screen.getByText('95% conf')).toBeDefined();
    expect(screen.getByText('72% conf')).toBeDefined();
    expect(screen.getByText('88% conf')).toBeDefined();
  });
});
