// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/artifacts', () => ({
  listArtifacts: vi.fn(),
  getArtifact: vi.fn(),
  getLineage: vi.fn(),
}));

import { useArtifacts, useArtifact, useArtifactLineage } from '../useArtifacts';
import * as api from '@api/artifacts';

// Shared wrapper factory
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { wrapper, queryClient };
}

const MOCK_ARTIFACT = {
  id: 'art-1',
  name: 'dataset.csv',
  type: 'dataset',
  size_bytes: 1024,
  created_at: '2026-01-01T00:00:00Z',
} as any;
const MOCK_ARTIFACTS = [
  MOCK_ARTIFACT,
  { id: 'art-2', name: 'model.bin', type: 'model', size_bytes: 2048, created_at: '2026-01-02T00:00:00Z' },
] as any;
const MOCK_LINEAGE = [
  { artifact_id: 'art-1', parent_id: null, run_id: 'run-1', step: 'ingest' },
  { artifact_id: 'art-1', parent_id: 'art-0', run_id: 'run-1', step: 'transform' },
] as any;

describe('useArtifacts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- useArtifacts (list) ----

  describe('useArtifacts()', () => {
    it('fetches artifact list without params', async () => {
      vi.mocked(api.listArtifacts).mockResolvedValue(MOCK_ARTIFACTS);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifacts(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_ARTIFACTS);
      expect(api.listArtifacts).toHaveBeenCalledWith(undefined);
    });

    it('passes filter params through to the API', async () => {
      vi.mocked(api.listArtifacts).mockResolvedValue([MOCK_ARTIFACT]);
      const { wrapper } = createWrapper();
      const params = { type: 'dataset', limit: 10, offset: 0 };

      const { result } = renderHook(() => useArtifacts(params), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.listArtifacts).toHaveBeenCalledWith(params);
    });

    it('includes params in the query key for cache separation', async () => {
      vi.mocked(api.listArtifacts).mockResolvedValue([]);
      const { wrapper, queryClient } = createWrapper();
      const params = { type: 'model', limit: 5 };

      renderHook(() => useArtifacts(params), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['artifacts', params]);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });

    it('returns error state when the API call fails', async () => {
      vi.mocked(api.listArtifacts).mockRejectedValue(new Error('Server error'));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifacts(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Server error');
    });
  });

  // ---- useArtifact (detail) ----

  describe('useArtifact(id)', () => {
    it('fetches a single artifact by ID', async () => {
      vi.mocked(api.getArtifact).mockResolvedValue(MOCK_ARTIFACT);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifact('art-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_ARTIFACT);
      expect(api.getArtifact).toHaveBeenCalledWith('art-1');
    });

    it('does not fetch when id is empty string (enabled: !!id)', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifact(''), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getArtifact).not.toHaveBeenCalled();
    });

    it('uses query key ["artifacts", id]', async () => {
      vi.mocked(api.getArtifact).mockResolvedValue(MOCK_ARTIFACT);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useArtifact('art-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['artifacts', 'art-1']);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });
  });

  // ---- useArtifactLineage ----

  describe('useArtifactLineage(id)', () => {
    it('fetches lineage for a given artifact', async () => {
      vi.mocked(api.getLineage).mockResolvedValue(MOCK_LINEAGE);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifactLineage('art-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_LINEAGE);
      expect(api.getLineage).toHaveBeenCalledWith('art-1');
    });

    it('does not fetch when id is empty string (enabled: !!id)', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useArtifactLineage(''), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getLineage).not.toHaveBeenCalled();
    });

    it('uses query key ["artifacts", id, "lineage"]', async () => {
      vi.mocked(api.getLineage).mockResolvedValue(MOCK_LINEAGE);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useArtifactLineage('art-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['artifacts', 'art-1', 'lineage']);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });

    it('refetches when id changes from empty to valid', async () => {
      vi.mocked(api.getLineage).mockResolvedValue(MOCK_LINEAGE);
      const { wrapper } = createWrapper();

      // Start with empty id
      const { result, rerender } = renderHook(
        ({ id }: { id: string }) => useArtifactLineage(id),
        { wrapper, initialProps: { id: '' } },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getLineage).not.toHaveBeenCalled();

      // Rerender with a valid id
      rerender({ id: 'art-1' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.getLineage).toHaveBeenCalledWith('art-1');
    });
  });
});
