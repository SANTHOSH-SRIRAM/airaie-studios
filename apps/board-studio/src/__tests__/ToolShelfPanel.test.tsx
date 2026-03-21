// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the toolshelf API
vi.mock('@api/toolshelf', () => ({
  resolveToolShelf: vi.fn(),
}));

import { resolveToolShelf } from '@api/toolshelf';
import type {
  ToolShelfEntry,
  PipelineShelfEntry,
  UnavailableEntry,
  ResolveResultV2,
} from '@api/toolshelf';

// We'll import ToolCard and useToolShelfResolve after mocks
import ToolCard from '@components/studio/ToolCard';

// --- Fixtures ---

const mockToolRecommended: ToolShelfEntry = {
  tool_id: 'tool_fea_solver',
  tool_version: '2.1.0',
  name: 'FEA Solver Pro',
  trust_level: 'certified',
  cost_estimate: 0.25,
  time_estimate: '5m',
  match_reasons: [
    'High compatibility with FEA intent type',
    'Certified trust level with 99.2% uptime',
    'Cost-effective for mesh sizes under 10M elements',
  ],
  success_rate: 0.95,
  confidence: 0.88,
  score: 0.92,
};

const mockToolAlternative: ToolShelfEntry = {
  tool_id: 'tool_fea_lite',
  tool_version: '1.0.0',
  name: 'FEA Lite',
  trust_level: 'verified',
  cost_estimate: 0.10,
  time_estimate: '3m',
  match_reasons: [
    'Basic FEA support',
    'Lower cost alternative',
  ],
  success_rate: 0.80,
  confidence: 0.70,
  score: 0.65,
};

const mockUnavailableTool: UnavailableEntry = {
  tool_id: 'tool_gpu_solver',
  name: 'GPU Accelerated Solver',
  reason: 'Requires GPU quota',
  action: 'Request GPU Quota',
  filter_stage: 'resource_check',
};

const mockResolveResult: ResolveResultV2 = {
  recommended_pipelines: [],
  recommended_tools: [mockToolRecommended, mockToolAlternative],
  unavailable_pipelines: [],
  unavailable_tools: [mockUnavailableTool],
  resolved_at: '2026-03-21T10:00:00Z',
  intent_type: 'fea',
};

// --- Test helpers ---

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// --- ToolCard tests ---

describe('ToolCard', () => {
  it('renders tool name, version, trust badge, cost estimate, success rate, and score bar', () => {
    render(
      <ToolCard entry={mockToolRecommended} variant="recommended" />,
    );

    expect(screen.getByText('FEA Solver Pro')).toBeInTheDocument();
    expect(screen.getByText('v2.1.0')).toBeInTheDocument();
    expect(screen.getByText('certified')).toBeInTheDocument();
    expect(screen.getByText('$0.25')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    // Score bar should exist
    const scoreBar = screen.getByTestId('score-bar');
    expect(scoreBar).toBeInTheDocument();
  });

  it('shows 1-line "Why" text from match_reasons[0]', () => {
    render(
      <ToolCard entry={mockToolRecommended} variant="recommended" />,
    );

    expect(
      screen.getByText('High compatibility with FEA intent type'),
    ).toBeInTheDocument();
  });

  it('clicking expand reveals full scoring breakdown (all match_reasons)', async () => {
    render(
      <ToolCard entry={mockToolRecommended} variant="recommended" />,
    );

    // Initially only the first reason is visible
    expect(
      screen.queryByText('Certified trust level with 99.2% uptime'),
    ).not.toBeInTheDocument();

    // Click expand button
    const expandBtn = screen.getByRole('button', { name: /expand/i });
    fireEvent.click(expandBtn);

    // Now all reasons should be visible
    expect(
      screen.getByText('Certified trust level with 99.2% uptime'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cost-effective for mesh sizes under 10M elements'),
    ).toBeInTheDocument();
  });

  it('renders unavailable variant with reason text and action button', () => {
    render(
      <ToolCard
        entry={{ ...mockUnavailableTool, score: 0, match_reasons: [], cost_estimate: 0, time_estimate: '', success_rate: 0, confidence: 0, tool_version: '' } as any}
        variant="unavailable"
        unavailableReason="Requires GPU quota"
        unavailableAction="Request GPU Quota"
      />,
    );

    expect(screen.getByText('GPU Accelerated Solver')).toBeInTheDocument();
    expect(screen.getByText('Requires GPU quota')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Request GPU Quota/i }),
    ).toBeInTheDocument();
  });
});

// --- useToolShelfResolve tests ---

describe('useToolShelfResolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state when intentType provided', async () => {
    const { renderHook } = await import('@testing-library/react');
    const { useToolShelfResolve } = await import('@hooks/useToolShelfResolve');

    (resolveToolShelf as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}), // Never resolves — stays loading
    );

    const { result } = renderHook(
      () => useToolShelfResolve('fea', 'prj_123'),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('returns data from resolveToolShelf when resolved', async () => {
    const { renderHook, waitFor } = await import('@testing-library/react');
    const { useToolShelfResolve } = await import('@hooks/useToolShelfResolve');

    (resolveToolShelf as ReturnType<typeof vi.fn>).mockResolvedValue(mockResolveResult);

    const { result } = renderHook(
      () => useToolShelfResolve('fea', 'prj_123'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResolveResult);
  });
});
