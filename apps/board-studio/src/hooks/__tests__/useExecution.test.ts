// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/execution', () => ({
  fetchToolRecommendations: vi.fn(),
  fetchCardEvidence: vi.fn(),
  runPreflight: vi.fn(),
}));

// Mock the plan hooks re-exported from useExecution
vi.mock('../usePlan', () => ({
  usePlan: vi.fn(),
  usePlanExecutionStatus: vi.fn(),
  useGeneratePlan: vi.fn(),
  useEditPlan: vi.fn(),
  useCompilePlan: vi.fn(),
  useValidatePlan: vi.fn(),
  useExecutePlan: vi.fn(),
  planKeys: {
    all: ['plans'],
    details: () => ['plans', 'detail'],
    detail: (cardId: string) => ['plans', 'detail', cardId],
    execution: (cardId: string) => ['plans', 'execution', cardId],
  },
}));

import {
  useToolRecommendations,
  useCardEvidence,
  useCardEvidencePolling,
  useRunPreflight,
  executionKeys,
} from '../useExecution';

import {
  fetchToolRecommendations,
  fetchCardEvidence,
  runPreflight,
} from '@api/execution';

// --- Test wrapper ---

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

// --- Tests ---

describe('executionKeys', () => {
  it('generates correct key structures', () => {
    expect(executionKeys.toolRecommendations('design_review')).toEqual([
      'tool-recommendations',
      'design_review',
    ]);
    expect(executionKeys.evidence('c1')).toEqual(['card-evidence', 'c1', undefined]);
    expect(executionKeys.evidence('c1', { latest: true })).toEqual([
      'card-evidence',
      'c1',
      { latest: true },
    ]);
  });
});

describe('useToolRecommendations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when intentType is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToolRecommendations(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchToolRecommendations).not.toHaveBeenCalled();
  });

  it('fetches tool recommendations when intentType is provided', async () => {
    const mockTools = [
      { slug: 'fem-solver', name: 'FEM Solver', version: '1.0', trust_level: 'certified', match_score: 0.95 },
    ];
    vi.mocked(fetchToolRecommendations).mockResolvedValue(mockTools as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useToolRecommendations('stress_analysis'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTools);
    expect(fetchToolRecommendations).toHaveBeenCalledWith('stress_analysis', undefined);
  });

  it('passes constraints to the API', async () => {
    vi.mocked(fetchToolRecommendations).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const constraints = { material: 'steel' };
    renderHook(
      () => useToolRecommendations('stress_analysis', constraints),
      { wrapper }
    );

    await waitFor(() =>
      expect(fetchToolRecommendations).toHaveBeenCalledWith('stress_analysis', constraints)
    );
  });
});

describe('useCardEvidence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardEvidence(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchCardEvidence).not.toHaveBeenCalled();
  });

  it('fetches evidence when cardId is provided', async () => {
    const mockEvidence = [
      { id: 'e1', card_id: 'c1', metric_key: 'stress', metric_value: 120, evaluation: 'pass' },
    ];
    vi.mocked(fetchCardEvidence).mockResolvedValue(mockEvidence as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardEvidence('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEvidence);
    expect(fetchCardEvidence).toHaveBeenCalledWith('c1', undefined);
  });

  it('passes filters to the API', async () => {
    vi.mocked(fetchCardEvidence).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const filters = { run_id: 'run-1', latest: true };
    renderHook(() => useCardEvidence('c1', filters), { wrapper });

    await waitFor(() =>
      expect(fetchCardEvidence).toHaveBeenCalledWith('c1', filters)
    );
  });
});

describe('useCardEvidencePolling', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCardEvidencePolling(undefined, true),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when enabled is false', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCardEvidencePolling('c1', false),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches when both cardId and enabled are truthy', async () => {
    const mockEvidence = [
      { id: 'e1', card_id: 'c1', metric_key: 'yield', metric_value: 98, evaluation: 'pass' },
    ];
    vi.mocked(fetchCardEvidence).mockResolvedValue(mockEvidence as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCardEvidencePolling('c1', true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEvidence);
    expect(fetchCardEvidence).toHaveBeenCalledWith('c1', { latest: true });
  });
});

describe('useRunPreflight', () => {
  beforeEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useRunPreflight(), { wrapper });

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('calls runPreflight and invalidates plan detail on success', async () => {
    const mockResult = { status: 'pass', validators: [] };
    vi.mocked(runPreflight).mockResolvedValue(mockResult as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRunPreflight(), { wrapper });
    result.current.mutate('c1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(runPreflight).toHaveBeenCalledWith('c1');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['plans', 'detail', 'c1'],
    });
  });
});
