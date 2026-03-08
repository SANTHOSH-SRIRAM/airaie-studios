// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/plans', () => ({
  fetchPlan: vi.fn(),
  generatePlan: vi.fn(),
  editPlan: vi.fn(),
  compilePlan: vi.fn(),
  validatePlan: vi.fn(),
  executePlan: vi.fn(),
  fetchPlanExecutionStatus: vi.fn(),
}));

import {
  usePlan,
  usePlanExecutionStatus,
  useGeneratePlan,
  useEditPlan,
  useCompilePlan,
  useValidatePlan,
  useExecutePlan,
  planKeys,
} from '../usePlan';

import {
  fetchPlan,
  generatePlan,
  editPlan,
  compilePlan,
  validatePlan,
  executePlan,
  fetchPlanExecutionStatus,
} from '@api/plans';

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

describe('planKeys', () => {
  it('generates correct key structures', () => {
    expect(planKeys.all).toEqual(['plans']);
    expect(planKeys.details()).toEqual(['plans', 'detail']);
    expect(planKeys.detail('c1')).toEqual(['plans', 'detail', 'c1']);
    expect(planKeys.execution('c1')).toEqual(['plans', 'execution', 'c1']);
  });
});

describe('usePlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePlan(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchPlan).not.toHaveBeenCalled();
  });

  it('fetches plan when cardId is provided', async () => {
    const mockPlan = {
      id: 'plan-1',
      card_id: 'c1',
      status: 'draft',
      steps: [{ id: 's1', tool_name: 'fem-solver', status: 'pending' }],
    };
    vi.mocked(fetchPlan).mockResolvedValue(mockPlan as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePlan('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPlan);
    expect(fetchPlan).toHaveBeenCalledWith('c1');
  });

  it('handles null response (plan not found)', async () => {
    vi.mocked(fetchPlan).mockResolvedValue(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePlan('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});

describe('usePlanExecutionStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePlanExecutionStatus(undefined, true),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled when enabled is false', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePlanExecutionStatus('c1', false),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is disabled by default (enabled defaults to false)', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePlanExecutionStatus('c1'),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches execution status when both cardId and enabled are truthy', async () => {
    const mockStatus = {
      plan_id: 'plan-1',
      status: 'executing',
      steps: [{ id: 's1', tool_name: 'solver', status: 'running' }],
      completed_steps: 0,
      total_steps: 1,
    };
    vi.mocked(fetchPlanExecutionStatus).mockResolvedValue(mockStatus as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => usePlanExecutionStatus('c1', true),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStatus);
    expect(fetchPlanExecutionStatus).toHaveBeenCalledWith('c1');
  });
});

describe('useGeneratePlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGeneratePlan('c1'), { wrapper });

    expect(typeof result.current.mutate).toBe('function');
  });

  it('calls generatePlan and invalidates plan detail on success', async () => {
    const mockPlan = { id: 'plan-1', card_id: 'c1', status: 'draft', steps: [] };
    vi.mocked(generatePlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGeneratePlan('c1'), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(generatePlan).toHaveBeenCalledWith('c1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.detail('c1') });
  });

  it('does not invalidate when cardId is undefined', async () => {
    const mockPlan = { id: 'plan-1', status: 'draft', steps: [] };
    vi.mocked(generatePlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGeneratePlan(undefined), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // generatePlan is called with undefined!, but invalidation should not happen
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe('useEditPlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls editPlan with cardId and payload, invalidates on success', async () => {
    const mockPlan = { id: 'plan-1', card_id: 'c1', status: 'draft', steps: [] };
    vi.mocked(editPlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEditPlan('c1'), { wrapper });
    const payload = { steps: [{ id: 's1', parameters: { mesh_size: 0.5 } }] };
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(editPlan).toHaveBeenCalledWith('c1', payload);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.detail('c1') });
  });
});

describe('useCompilePlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls compilePlan and invalidates on success', async () => {
    const mockPlan = { id: 'plan-1', card_id: 'c1', status: 'validated', steps: [] };
    vi.mocked(compilePlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompilePlan('c1'), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(compilePlan).toHaveBeenCalledWith('c1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.detail('c1') });
  });
});

describe('useValidatePlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls validatePlan and invalidates on success', async () => {
    const mockPlan = { id: 'plan-1', card_id: 'c1', status: 'validated', steps: [] };
    vi.mocked(validatePlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useValidatePlan('c1'), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(validatePlan).toHaveBeenCalledWith('c1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.detail('c1') });
  });
});

describe('useExecutePlan', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls executePlan and invalidates both plan detail and execution on success', async () => {
    const mockPlan = { id: 'plan-1', card_id: 'c1', status: 'executing', steps: [] };
    vi.mocked(executePlan).mockResolvedValue(mockPlan as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useExecutePlan('c1'), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(executePlan).toHaveBeenCalledWith('c1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.detail('c1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: planKeys.execution('c1') });
  });
});
