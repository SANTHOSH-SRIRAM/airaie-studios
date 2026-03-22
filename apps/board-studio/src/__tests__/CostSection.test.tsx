// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { Card } from '@/types/board';

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

// --- Tests ---

describe('CostSection', () => {
  let CostSection: any;

  beforeEach(async () => {
    const mod = await import('@components/studio/CostSection');
    CostSection = mod.default;
  });

  it('shows estimated and actual cost when both available', () => {
    const card = makeCard({ cost_estimate: 12.5, actual_cost: 10.0 });
    render(<CostSection card={card} />);
    expect(screen.getByText('$12.50')).toBeDefined();
    expect(screen.getByText('$10.00')).toBeDefined();
  });

  it('shows only estimated cost with "Pending" actual when actual is null', () => {
    const card = makeCard({ cost_estimate: 25.0 });
    render(<CostSection card={card} />);
    expect(screen.getByText('$25.00')).toBeDefined();
    expect(screen.getByText('Pending')).toBeDefined();
  });

  it('shows "Cost tracking not configured" when no cost data at all', () => {
    const card = makeCard();
    render(<CostSection card={card} />);
    expect(screen.getByText('Cost tracking not configured')).toBeDefined();
  });

  it('progress bar fills based on actual/estimated ratio', () => {
    const card = makeCard({ cost_estimate: 100, actual_cost: 50 });
    const { container } = render(<CostSection card={card} />);
    // Find the progress bar inner div
    const progressBar = container.querySelector('[data-testid="cost-progress-bar"]');
    expect(progressBar).toBeDefined();
    expect((progressBar as HTMLElement)?.style.width).toBe('50%');
  });
});
