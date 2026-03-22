// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { DecisionTrace } from '@/types/execution';

// ─── Mock useDecisionTraces ─────────────────────────────────

const mockTraces: DecisionTrace[] = [
  {
    id: 'dt-1',
    run_id: 'run-1',
    card_id: 'card-1',
    board_id: 'board-1',
    decision_type: 'parameter_override',
    title: 'Override mesh size',
    reasoning: 'Mesh size adjusted for convergence',
    inputs: { mesh_size: 0.5 },
    outcome: { accepted: true },
    confidence: 0.95,
    actor: 'agent',
    created_at: '2026-03-20T10:00:00Z',
  },
  {
    id: 'dt-2',
    run_id: 'run-1',
    card_id: 'card-1',
    board_id: 'board-1',
    decision_type: 'tool_selection',
    title: 'Selected FEA solver',
    reasoning: 'Best match for stress analysis',
    inputs: { candidates: ['solver-a', 'solver-b'] },
    outcome: { selected: 'solver-a' },
    confidence: 0.88,
    actor: 'agent',
    created_at: '2026-03-20T10:01:00Z',
  },
  {
    id: 'dt-3',
    run_id: 'run-1',
    card_id: 'card-1',
    board_id: 'board-1',
    decision_type: 'gate_evaluation',
    title: 'Gate passed',
    reasoning: 'All criteria met',
    inputs: {},
    outcome: { passed: true },
    confidence: 1.0,
    actor: 'system',
    created_at: '2026-03-20T10:02:00Z',
  },
];

let mockIsLoading = false;
let mockData: DecisionTrace[] | undefined = mockTraces;

vi.mock('@hooks/useRuns', () => ({
  useDecisionTraces: () => ({
    data: mockData,
    isLoading: mockIsLoading,
  }),
}));

// Mock @airaie/ui
vi.mock('@airaie/ui', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
  Spinner: ({ size }: any) => <div data-testid="spinner" data-size={size} />,
}));

// Import after mocks
import DecisionTraceTimeline from '@components/studio/DecisionTraceTimeline';

describe('DecisionTraceTimeline', () => {
  beforeEach(() => {
    mockIsLoading = false;
    mockData = mockTraces;
  });

  it('renders all 8 phase labels', () => {
    render(<DecisionTraceTimeline runId="run-1" />);

    expect(screen.getByText('Context')).toBeInTheDocument();
    expect(screen.getByText('Scoring')).toBeInTheDocument();
    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Execution')).toBeInTheDocument();
    expect(screen.getByText('Recording')).toBeInTheDocument();
  });

  it('renders step numbers 1-8', () => {
    render(<DecisionTraceTimeline runId="run-1" />);

    for (let i = 1; i <= 8; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('shows detail panel when clicking a completed phase', () => {
    render(<DecisionTraceTimeline runId="run-1" />);

    // Context phase has parameter_override trace -> completed
    const contextBtn = screen.getByLabelText('Context - completed');
    fireEvent.click(contextBtn);

    // Detail panel should appear
    const detailPanel = screen.getByTestId('phase-detail-panel');
    expect(detailPanel).toBeInTheDocument();
    expect(screen.getByText('Mesh size adjusted for convergence')).toBeInTheDocument();
  });

  it('collapses detail panel when clicking the same phase again', () => {
    render(<DecisionTraceTimeline runId="run-1" />);

    const contextBtn = screen.getByLabelText('Context - completed');
    fireEvent.click(contextBtn);
    expect(screen.getByTestId('phase-detail-panel')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(contextBtn);
    expect(screen.queryByTestId('phase-detail-panel')).not.toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    mockIsLoading = true;
    render(<DecisionTraceTimeline runId="run-1" />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows empty state when no traces', () => {
    mockData = [];
    render(<DecisionTraceTimeline runId="run-1" />);
    expect(screen.getByText('No decision trace data available.')).toBeInTheDocument();
  });

  it('shows inputs and outcome in detail panel', () => {
    render(<DecisionTraceTimeline runId="run-1" />);

    const scoringBtn = screen.getByLabelText('Scoring - completed');
    fireEvent.click(scoringBtn);

    expect(screen.getByText('Best match for stress analysis')).toBeInTheDocument();
    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Outcome')).toBeInTheDocument();
  });
});
