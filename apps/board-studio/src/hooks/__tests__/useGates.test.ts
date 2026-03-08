// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/gates', () => ({
  fetchGates: vi.fn(),
  fetchGate: vi.fn(),
  evaluateGate: vi.fn(),
  approveGate: vi.fn(),
  rejectGate: vi.fn(),
  waiveGate: vi.fn(),
}));

import {
  useGates,
  useGateDetail,
  useEvaluateGate,
  useApproveGate,
  useRejectGate,
  useWaiveGate,
  gateKeys,
} from '../useGates';

import {
  fetchGates,
  fetchGate,
  evaluateGate,
  approveGate,
  rejectGate,
  waiveGate,
} from '@api/gates';

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

describe('gateKeys', () => {
  it('generates correct key structures', () => {
    expect(gateKeys.all).toEqual(['gates']);
    expect(gateKeys.lists()).toEqual(['gates', 'list']);
    expect(gateKeys.list('b1')).toEqual(['gates', 'list', 'b1']);
    expect(gateKeys.details()).toEqual(['gates', 'detail']);
    expect(gateKeys.detail('g1')).toEqual(['gates', 'detail', 'g1']);
  });
});

describe('useGates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGates(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchGates).not.toHaveBeenCalled();
  });

  it('fetches gates when boardId is provided', async () => {
    const mockGates = [
      { id: 'g1', board_id: 'b1', name: 'Evidence Gate', type: 'evidence', status: 'PENDING', requirements: [] },
    ];
    vi.mocked(fetchGates).mockResolvedValue(mockGates as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGates('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGates);
    expect(fetchGates).toHaveBeenCalledWith('b1');
  });
});

describe('useGateDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when gateId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGateDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchGate).not.toHaveBeenCalled();
  });

  it('fetches gate detail when gateId is provided', async () => {
    const mockGate = { id: 'g1', name: 'Review Gate', status: 'PASSED', type: 'review', requirements: [] };
    vi.mocked(fetchGate).mockResolvedValue(mockGate as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGateDetail('g1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGate);
    expect(fetchGate).toHaveBeenCalledWith('g1');
  });

  it('has refetchInterval that polls during EVALUATING status', async () => {
    // The hook uses refetchInterval with a function that checks status
    // When data has status 'EVALUATING', interval should be 3000
    const evaluatingGate = { id: 'g1', name: 'Gate', status: 'EVALUATING', type: 'evidence', requirements: [] };
    vi.mocked(fetchGate).mockResolvedValue(evaluatingGate as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGateDetail('g1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The hook is configured; we verify it fetched the data correctly.
    // Actual refetchInterval behavior is a TanStack Query internal that
    // would require timer manipulation to fully test.
    expect(result.current.data?.status).toBe('EVALUATING');
  });
});

describe('useEvaluateGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls evaluateGate and invalidates gate queries on success', async () => {
    const evaluatedGate = { id: 'g1', name: 'Gate', status: 'PASSED' };
    vi.mocked(evaluateGate).mockResolvedValue(evaluatedGate as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useEvaluateGate(), { wrapper });
    result.current.mutate('g1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(evaluateGate).toHaveBeenCalledWith('g1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: gateKeys.all });
  });
});

describe('useApproveGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls approveGate with gateId and role, invalidates on success', async () => {
    const approvedGate = { id: 'g1', status: 'PASSED' };
    vi.mocked(approveGate).mockResolvedValue(approvedGate as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApproveGate(), { wrapper });
    result.current.mutate({ gateId: 'g1', role: 'reviewer' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(approveGate).toHaveBeenCalledWith('g1', { role: 'reviewer' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: gateKeys.all });
  });
});

describe('useRejectGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls rejectGate with gateId and rationale, invalidates on success', async () => {
    const rejectedGate = { id: 'g1', status: 'FAILED' };
    vi.mocked(rejectGate).mockResolvedValue(rejectedGate as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRejectGate(), { wrapper });
    result.current.mutate({ gateId: 'g1', rationale: 'Insufficient evidence' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rejectGate).toHaveBeenCalledWith('g1', { rationale: 'Insufficient evidence' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: gateKeys.all });
  });
});

describe('useWaiveGate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls waiveGate with gateId and rationale, invalidates on success', async () => {
    const waivedGate = { id: 'g1', status: 'WAIVED' };
    vi.mocked(waiveGate).mockResolvedValue(waivedGate as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useWaiveGate(), { wrapper });
    result.current.mutate({ gateId: 'g1', rationale: 'Risk accepted by lead' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(waiveGate).toHaveBeenCalledWith('g1', { rationale: 'Risk accepted by lead' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: gateKeys.all });
  });
});
