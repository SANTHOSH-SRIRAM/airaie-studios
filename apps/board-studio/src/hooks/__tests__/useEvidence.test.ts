// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API modules before importing hooks
vi.mock('@api/cards', () => ({
  fetchCardEvidence: vi.fn(),
}));

vi.mock('@api/boards', () => ({
  fetchEvidenceDiff: vi.fn(),
  fetchTriage: vi.fn(),
  fetchReproducibility: vi.fn(),
}));

import {
  useCardEvidence,
  useEvidenceDiff,
  useTriage,
  useReproducibility,
  evidenceKeys,
} from '../useEvidence';

import { fetchCardEvidence } from '@api/cards';
import { fetchEvidenceDiff, fetchTriage, fetchReproducibility } from '@api/boards';

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

describe('evidenceKeys', () => {
  it('generates correct key structures', () => {
    expect(evidenceKeys.all).toEqual(['evidence']);
    expect(evidenceKeys.card('c1')).toEqual(['evidence', 'card', 'c1', undefined]);
    expect(evidenceKeys.card('c1', { latest: true })).toEqual([
      'evidence',
      'card',
      'c1',
      { latest: true },
    ]);
    expect(evidenceKeys.card('c1', { run_id: 'r1' })).toEqual([
      'evidence',
      'card',
      'c1',
      { run_id: 'r1' },
    ]);
    expect(evidenceKeys.diff('b1')).toEqual(['evidence', 'diff', 'b1']);
    expect(evidenceKeys.triage('b1')).toEqual(['evidence', 'triage', 'b1']);
    expect(evidenceKeys.reproducibility('b1')).toEqual(['evidence', 'reproducibility', 'b1']);
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
      { id: 'e1', card_id: 'c1', criterion: 'stress < 200MPa', value: 150, passed: true },
    ];
    vi.mocked(fetchCardEvidence).mockResolvedValue(mockEvidence as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardEvidence('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEvidence);
    expect(fetchCardEvidence).toHaveBeenCalledWith('c1', undefined);
  });

  it('passes params to the API', async () => {
    vi.mocked(fetchCardEvidence).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const params = { run_id: 'run-1', latest: true as const };
    renderHook(() => useCardEvidence('c1', params), { wrapper });

    await waitFor(() =>
      expect(fetchCardEvidence).toHaveBeenCalledWith('c1', params)
    );
  });
});

describe('useEvidenceDiff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEvidenceDiff(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchEvidenceDiff).not.toHaveBeenCalled();
  });

  it('fetches evidence diff when boardId is provided', async () => {
    const mockDiffs = [
      { card_id: 'c1', metric_key: 'stress', before: 180, after: 150, delta: -30 },
    ];
    vi.mocked(fetchEvidenceDiff).mockResolvedValue(mockDiffs as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useEvidenceDiff('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDiffs);
    expect(fetchEvidenceDiff).toHaveBeenCalledWith('b1');
  });
});

describe('useTriage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTriage(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchTriage).not.toHaveBeenCalled();
  });

  it('fetches triage when boardId is provided', async () => {
    const mockTriage = {
      board_id: 'b1',
      priority_cards: ['c1', 'c3'],
      recommendations: ['Re-run stress analysis'],
    };
    vi.mocked(fetchTriage).mockResolvedValue(mockTriage as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTriage('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTriage);
    expect(fetchTriage).toHaveBeenCalledWith('b1');
  });
});

describe('useReproducibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReproducibility(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchReproducibility).not.toHaveBeenCalled();
  });

  it('fetches reproducibility score when boardId is provided', async () => {
    const mockScore = {
      board_id: 'b1',
      overall_score: 0.92,
      details: { deterministic: true, version_pinned: true },
    };
    vi.mocked(fetchReproducibility).mockResolvedValue(mockScore as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReproducibility('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockScore);
    expect(fetchReproducibility).toHaveBeenCalledWith('b1');
  });

  it('handles error state', async () => {
    vi.mocked(fetchReproducibility).mockRejectedValue(new Error('Network error'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReproducibility('b1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
