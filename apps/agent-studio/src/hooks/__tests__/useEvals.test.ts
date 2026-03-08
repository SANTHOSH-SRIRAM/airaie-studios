import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useEvalCases,
  useCreateEvalCase,
  useUpdateEvalCase,
  useDeleteEvalCase,
} from '../useEvals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@api/evals', () => ({
  listEvalCases: vi.fn(),
  getEvalCase: vi.fn(),
  createEvalCase: vi.fn(),
  updateEvalCase: vi.fn(),
  deleteEvalCase: vi.fn(),
}));

import * as api from '@api/evals';
import type { EvalCase } from '@api/evals';

const mockedApi = vi.mocked(api);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
}

const sampleEvalCase: EvalCase = {
  id: 'eval-1',
  agent_id: 'a1',
  project_id: 'p1',
  name: 'Test Eval',
  inputs: { question: 'What is AI?' },
  criteria: { min_score: 0.8 },
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useEvalCases', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches eval cases for an agent', async () => {
    const cases = [sampleEvalCase];
    mockedApi.listEvalCases.mockResolvedValueOnce(cases);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useEvalCases('a1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cases);
    expect(mockedApi.listEvalCases).toHaveBeenCalledWith('a1');
  });

  it('uses query key ["agents", agentId, "evals"]', async () => {
    mockedApi.listEvalCases.mockResolvedValueOnce([]);
    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useEvalCases('a1'), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['agents', 'a1', 'evals'])?.status).toBe('success'),
    );
  });

  it('does not fetch when agentId is empty (enabled: !!agentId)', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useEvalCases(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.listEvalCases).not.toHaveBeenCalled();
  });

  it('returns loading state initially', () => {
    mockedApi.listEvalCases.mockReturnValue(new Promise(() => {})); // never resolves
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useEvalCases('a1'), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useCreateEvalCase', () => {
  afterEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateEvalCase(), { wrapper: Wrapper });

    expect(typeof result.current.mutate).toBe('function');
  });

  it('creates an eval case and invalidates the list', async () => {
    mockedApi.createEvalCase.mockResolvedValueOnce(sampleEvalCase);
    mockedApi.listEvalCases.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Prime the evals cache
    renderHook(() => useEvalCases('a1'), { wrapper: Wrapper });
    await waitFor(() =>
      expect(queryClient.getQueryState(['agents', 'a1', 'evals'])?.status).toBe('success'),
    );

    const { result } = renderHook(() => useCreateEvalCase(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      name: 'Test Eval',
      inputs: { question: 'What is AI?' },
      criteria: { min_score: 0.8 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.createEvalCase).toHaveBeenCalledWith('a1', {
      name: 'Test Eval',
      inputs: { question: 'What is AI?' },
      criteria: { min_score: 0.8 },
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents', 'a1', 'evals'] }),
    );
  });
});

describe('useUpdateEvalCase', () => {
  afterEach(() => vi.clearAllMocks());

  it('updates an eval case and invalidates the list', async () => {
    const updated = { ...sampleEvalCase, name: 'Updated Eval' };
    mockedApi.updateEvalCase.mockResolvedValueOnce(updated);
    mockedApi.listEvalCases.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateEvalCase(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      evalId: 'eval-1',
      name: 'Updated Eval',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.updateEvalCase).toHaveBeenCalledWith('a1', 'eval-1', {
      name: 'Updated Eval',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents', 'a1', 'evals'] }),
    );
  });

  it('supports partial updates (name, inputs, criteria)', async () => {
    mockedApi.updateEvalCase.mockResolvedValueOnce(sampleEvalCase);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateEvalCase(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      evalId: 'eval-1',
      criteria: { max_cost: 1.5 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.updateEvalCase).toHaveBeenCalledWith('a1', 'eval-1', {
      criteria: { max_cost: 1.5 },
    });
  });
});

describe('useDeleteEvalCase', () => {
  afterEach(() => vi.clearAllMocks());

  it('deletes an eval case and invalidates the list', async () => {
    mockedApi.deleteEvalCase.mockResolvedValueOnce(undefined);
    mockedApi.listEvalCases.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Prime cache
    renderHook(() => useEvalCases('a1'), { wrapper: Wrapper });
    await waitFor(() =>
      expect(queryClient.getQueryState(['agents', 'a1', 'evals'])?.status).toBe('success'),
    );

    const { result } = renderHook(() => useDeleteEvalCase(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', evalId: 'eval-1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.deleteEvalCase).toHaveBeenCalledWith('a1', 'eval-1');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents', 'a1', 'evals'] }),
    );
  });

  it('handles deletion error', async () => {
    mockedApi.deleteEvalCase.mockRejectedValueOnce(new Error('Not found'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteEvalCase(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', evalId: 'nonexistent' });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect((result.current.error as Error).message).toBe('Not found');
  });
});
