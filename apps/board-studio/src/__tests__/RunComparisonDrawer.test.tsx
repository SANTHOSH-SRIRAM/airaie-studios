// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { Card } from '@/types/board';
import type { CardRun } from '@api/cards';

// Mock @airaie/charts
vi.mock('@airaie/charts', () => ({
  BarChart: ({ children, ...props }: any) => <div data-testid="bar-chart" {...props}>{children}</div>,
  Bar: (props: any) => <div data-testid="bar" data-datakey={props.dataKey} />,
  XAxis: (props: any) => <div data-testid="xaxis" />,
  YAxis: (props: any) => <div data-testid="yaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

import RunComparisonDrawer from '@components/studio/RunComparisonDrawer';

// --- Fixtures ---

const makeCard = (kpis: Record<string, unknown> = {}): Card => ({
  id: 'card-1',
  board_id: 'board-1',
  name: 'Test Card',
  type: 'analysis',
  status: 'completed',
  ordinal: 0,
  config: {},
  kpis,
  dependencies: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const makeRun = (id: string, overrides: Partial<CardRun> = {}): CardRun => ({
  id,
  card_id: 'card-1',
  status: 'completed',
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('RunComparisonDrawer', () => {
  const defaultCard = makeCard({
    max_stress: { value: 100, unit: 'MPa' },
    displacement: { value: 0.5, unit: 'mm' },
  });

  const runs = [
    makeRun('run-001', { duration_ms: 5000 }),
    makeRun('run-002', { duration_ms: 8000 }),
  ];

  it('renders KPI rows with run columns when given 2 runs with KPIs', () => {
    render(
      <RunComparisonDrawer open={true} onClose={vi.fn()} runs={runs} card={defaultCard} />
    );

    // Should show KPI key names as row labels
    expect(screen.getByText('max_stress')).toBeInTheDocument();
    expect(screen.getByText('displacement')).toBeInTheDocument();

    // Should show run ID columns (truncated to 8 chars)
    expect(screen.getByText('run-001')).toBeInTheDocument();
    expect(screen.getByText('run-002')).toBeInTheDocument();
  });

  it('shows delta column with green ArrowUp for improvements', () => {
    const card = makeCard({
      efficiency: { value: 90, unit: '%' },
    });

    // Two runs with KPIs where second is better (higher value = improvement)
    const twoRuns = [
      makeRun('run-aaa', { duration_ms: 1000 }),
      makeRun('run-bbb', { duration_ms: 2000 }),
    ];

    render(
      <RunComparisonDrawer open={true} onClose={vi.fn()} runs={twoRuns} card={card} />
    );

    // Delta column header should exist
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });

  it('shows delta column with red ArrowDown for regressions', () => {
    const card = makeCard({
      error_rate: { value: 5, unit: '%' },
    });

    const twoRuns = [
      makeRun('run-xxx', { duration_ms: 1000 }),
      makeRun('run-yyy', { duration_ms: 2000 }),
    ];

    render(
      <RunComparisonDrawer open={true} onClose={vi.fn()} runs={twoRuns} card={card} />
    );

    // Should render delta column
    expect(screen.getByText('Delta')).toBeInTheDocument();
  });

  it('toggles between table and chart view modes', () => {
    render(
      <RunComparisonDrawer open={true} onClose={vi.fn()} runs={runs} card={defaultCard} />
    );

    // Table mode should be default
    expect(screen.getByRole('button', { name: /chart/i })).toBeInTheDocument();

    // Click chart toggle
    fireEvent.click(screen.getByRole('button', { name: /chart/i }));

    // Should now show chart
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();

    // Should have a button to go back to table
    expect(screen.getByRole('button', { name: /table/i })).toBeInTheDocument();
  });

  it('renders empty state when runs have no KPI overlap', () => {
    const emptyCard = makeCard({});

    render(
      <RunComparisonDrawer open={true} onClose={vi.fn()} runs={runs} card={emptyCard} />
    );

    expect(screen.getByText(/no kpi data available/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();

    render(
      <RunComparisonDrawer open={true} onClose={onClose} runs={runs} card={defaultCard} />
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when open is false', () => {
    const { container } = render(
      <RunComparisonDrawer open={false} onClose={vi.fn()} runs={runs} card={defaultCard} />
    );

    expect(container.innerHTML).toBe('');
  });

  it('closes when backdrop is clicked', () => {
    const onClose = vi.fn();

    render(
      <RunComparisonDrawer open={true} onClose={onClose} runs={runs} card={defaultCard} />
    );

    fireEvent.click(screen.getByTestId('comparison-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
