// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/triggers', () => ({
  listTriggers: vi.fn(),
  getTrigger: vi.fn(),
  createTrigger: vi.fn(),
  updateTrigger: vi.fn(),
  deleteTrigger: vi.fn(),
}));

import {
  useTriggers,
  useTrigger,
  useCreateTrigger,
  useUpdateTrigger,
  useDeleteTrigger,
} from '../useTriggers';
import * as api from '@api/triggers';

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

const MOCK_TRIGGER = {
  id: 'trg-1',
  workflow_id: 'wf-1',
  project_id: 'prj-1',
  type: 'cron' as const,
  config: { schedule: '*/5 * * * *' },
  enabled: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const MOCK_TRIGGERS = [
  MOCK_TRIGGER,
  {
    id: 'trg-2',
    workflow_id: 'wf-1',
    project_id: 'prj-1',
    type: 'webhook' as const,
    config: { url: 'https://example.com/hook' },
    enabled: false,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

describe('useTriggers hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- useTriggers (list) ----

  describe('useTriggers(workflowId)', () => {
    it('fetches triggers for a given workflow', async () => {
      vi.mocked(api.listTriggers).mockResolvedValue(MOCK_TRIGGERS);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTriggers('wf-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_TRIGGERS);
      expect(api.listTriggers).toHaveBeenCalledWith('wf-1');
    });

    it('does not fetch when workflowId is empty (enabled: !!workflowId)', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTriggers(''), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.listTriggers).not.toHaveBeenCalled();
    });

    it('uses query key ["triggers", workflowId]', async () => {
      vi.mocked(api.listTriggers).mockResolvedValue([]);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useTriggers('wf-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['triggers', 'wf-1']);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });
  });

  // ---- useTrigger (detail) ----

  describe('useTrigger(workflowId, triggerId)', () => {
    it('fetches a specific trigger by workflowId and triggerId', async () => {
      vi.mocked(api.getTrigger).mockResolvedValue(MOCK_TRIGGER);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTrigger('wf-1', 'trg-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_TRIGGER);
      expect(api.getTrigger).toHaveBeenCalledWith('wf-1', 'trg-1');
    });

    it('does not fetch when workflowId is empty', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTrigger('', 'trg-1'), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getTrigger).not.toHaveBeenCalled();
    });

    it('does not fetch when triggerId is empty', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTrigger('wf-1', ''), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getTrigger).not.toHaveBeenCalled();
    });

    it('uses query key ["triggers", workflowId, triggerId]', async () => {
      vi.mocked(api.getTrigger).mockResolvedValue(MOCK_TRIGGER);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useTrigger('wf-1', 'trg-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['triggers', 'wf-1', 'trg-1']);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });
  });

  // ---- useCreateTrigger ----

  describe('useCreateTrigger(workflowId)', () => {
    it('exposes a mutate function', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateTrigger('wf-1'), { wrapper });
      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
    });

    it('calls api.createTrigger and invalidates triggers list on success', async () => {
      vi.mocked(api.createTrigger).mockResolvedValue(MOCK_TRIGGER);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTrigger('wf-1'), { wrapper });

      const body = { type: 'cron', config: { schedule: '0 * * * *' }, enabled: true };
      result.current.mutate(body);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.createTrigger).toHaveBeenCalledWith('wf-1', body);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['triggers', 'wf-1'] });
    });
  });

  // ---- useUpdateTrigger ----

  describe('useUpdateTrigger(workflowId)', () => {
    it('calls api.updateTrigger and invalidates triggers list on success', async () => {
      const updatedTrigger = { ...MOCK_TRIGGER, enabled: false };
      vi.mocked(api.updateTrigger).mockResolvedValue(updatedTrigger);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTrigger('wf-1'), { wrapper });

      result.current.mutate({ triggerId: 'trg-1', enabled: false });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.updateTrigger).toHaveBeenCalledWith('wf-1', 'trg-1', { enabled: false });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['triggers', 'wf-1'] });
    });

    it('passes partial update fields correctly (type + config)', async () => {
      vi.mocked(api.updateTrigger).mockResolvedValue(MOCK_TRIGGER);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpdateTrigger('wf-1'), { wrapper });

      result.current.mutate({
        triggerId: 'trg-1',
        type: 'webhook',
        config: { url: 'https://new.example.com' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.updateTrigger).toHaveBeenCalledWith('wf-1', 'trg-1', {
        type: 'webhook',
        config: { url: 'https://new.example.com' },
      });
    });
  });

  // ---- useDeleteTrigger ----

  describe('useDeleteTrigger(workflowId)', () => {
    it('calls api.deleteTrigger and invalidates triggers list on success', async () => {
      vi.mocked(api.deleteTrigger).mockResolvedValue(undefined);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTrigger('wf-1'), { wrapper });

      result.current.mutate('trg-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.deleteTrigger).toHaveBeenCalledWith('wf-1', 'trg-1');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['triggers', 'wf-1'] });
    });

    it('returns error state when delete fails', async () => {
      vi.mocked(api.deleteTrigger).mockRejectedValue(new Error('Not found'));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteTrigger('wf-1'), { wrapper });

      result.current.mutate('trg-nonexistent');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not found');
    });
  });
});
