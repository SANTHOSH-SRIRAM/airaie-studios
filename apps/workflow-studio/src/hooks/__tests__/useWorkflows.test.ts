// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/workflows', () => ({
  listWorkflows: vi.fn(),
  getWorkflow: vi.fn(),
  createWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  listVersions: vi.fn(),
  getVersion: vi.fn(),
  createVersion: vi.fn(),
  publishVersion: vi.fn(),
  compileWorkflow: vi.fn(),
  validateWorkflow: vi.fn(),
}));

import {
  useWorkflows,
  useWorkflow,
  useCreateWorkflow,
  useDeleteWorkflow,
  useWorkflowVersions,
  useWorkflowVersion,
  useCreateVersion,
  usePublishVersion,
  useCompileWorkflow,
  useValidateWorkflow,
} from '../useWorkflows';
import * as api from '@api/workflows';

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

const MOCK_WORKFLOW = { id: 'wf-1', name: 'Test Workflow', description: 'desc' } as any;
const MOCK_WORKFLOWS = [MOCK_WORKFLOW, { id: 'wf-2', name: 'Second', description: '' }] as any;
const MOCK_VERSION = { version: 1, workflow_id: 'wf-1', dsl: { steps: [] }, published: false } as any;
const MOCK_VERSIONS = [MOCK_VERSION, { version: 2, workflow_id: 'wf-1', dsl: {}, published: true }] as any;

describe('useWorkflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- useWorkflows (list) ----

  describe('useWorkflows()', () => {
    it('fetches workflow list and returns data on success', async () => {
      vi.mocked(api.listWorkflows).mockResolvedValue(MOCK_WORKFLOWS);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflows(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_WORKFLOWS);
      expect(api.listWorkflows).toHaveBeenCalledOnce();
    });

    it('uses the correct query key ["workflows"]', async () => {
      vi.mocked(api.listWorkflows).mockResolvedValue([]);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useWorkflows(), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['workflows']);
        expect(state).toBeDefined();
      });
    });

    it('returns error state when API fails', async () => {
      vi.mocked(api.listWorkflows).mockRejectedValue(new Error('Network error'));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflows(), { wrapper });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  // ---- useWorkflow (detail) ----

  describe('useWorkflow(id)', () => {
    it('fetches a single workflow by ID', async () => {
      vi.mocked(api.getWorkflow).mockResolvedValue(MOCK_WORKFLOW);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflow('wf-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_WORKFLOW);
      expect(api.getWorkflow).toHaveBeenCalledWith('wf-1');
    });

    it('does not fetch when id is empty string (enabled: !!id)', async () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflow(''), { wrapper });

      // Should stay in pending/idle state, never call the API
      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getWorkflow).not.toHaveBeenCalled();
    });

    it('uses query key ["workflows", id]', async () => {
      vi.mocked(api.getWorkflow).mockResolvedValue(MOCK_WORKFLOW);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useWorkflow('wf-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['workflows', 'wf-1']);
        expect(state).toBeDefined();
        expect(state?.status).toBe('success');
      });
    });
  });

  // ---- useCreateWorkflow ----

  describe('useCreateWorkflow()', () => {
    it('exposes a mutate function', () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateWorkflow(), { wrapper });
      expect(typeof result.current.mutate).toBe('function');
      expect(typeof result.current.mutateAsync).toBe('function');
    });

    it('calls api.createWorkflow on success', async () => {
      vi.mocked(api.createWorkflow).mockResolvedValue(MOCK_WORKFLOW as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCreateWorkflow(), { wrapper });

      result.current.mutate({ name: 'New Workflow', description: 'new desc' });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  // ---- useDeleteWorkflow ----

  describe('useDeleteWorkflow()', () => {
    it('calls api.deleteWorkflow on success', async () => {
      vi.mocked(api.deleteWorkflow).mockResolvedValue(undefined as any);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useDeleteWorkflow(), { wrapper });

      result.current.mutate('wf-1');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  // ---- useWorkflowVersions ----

  describe('useWorkflowVersions(workflowId)', () => {
    it('fetches versions for a given workflow', async () => {
      vi.mocked(api.listVersions).mockResolvedValue(MOCK_VERSIONS);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflowVersions('wf-1'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(MOCK_VERSIONS);
      expect(api.listVersions).toHaveBeenCalledWith('wf-1');
    });

    it('does not fetch when workflowId is empty', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflowVersions(''), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.listVersions).not.toHaveBeenCalled();
    });

    it('uses query key ["workflows", workflowId, "versions"]', async () => {
      vi.mocked(api.listVersions).mockResolvedValue([]);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useWorkflowVersions('wf-1'), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['workflows', 'wf-1', 'versions']);
        expect(state).toBeDefined();
      });
    });
  });

  // ---- useWorkflowVersion ----

  describe('useWorkflowVersion(workflowId, version)', () => {
    it('fetches a specific version', async () => {
      vi.mocked(api.getVersion).mockResolvedValue(MOCK_VERSION);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflowVersion('wf-1', 1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.getVersion).toHaveBeenCalledWith('wf-1', 1);
    });

    it('does not fetch when workflowId is empty', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflowVersion('', 1), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getVersion).not.toHaveBeenCalled();
    });

    it('does not fetch when version is 0', () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useWorkflowVersion('wf-1', 0), { wrapper });

      expect(result.current.fetchStatus).toBe('idle');
      expect(api.getVersion).not.toHaveBeenCalled();
    });

    it('uses query key ["workflows", workflowId, "versions", version]', async () => {
      vi.mocked(api.getVersion).mockResolvedValue(MOCK_VERSION);
      const { wrapper, queryClient } = createWrapper();

      renderHook(() => useWorkflowVersion('wf-1', 3), { wrapper });

      await waitFor(() => {
        const state = queryClient.getQueryState(['workflows', 'wf-1', 'versions', 3]);
        expect(state).toBeDefined();
      });
    });
  });

  // ---- useCreateVersion ----

  describe('useCreateVersion()', () => {
    it('creates a version and invalidates the versions query', async () => {
      vi.mocked(api.createVersion).mockResolvedValue(MOCK_VERSION);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateVersion(), { wrapper });

      result.current.mutate({ workflowId: 'wf-1', dsl: { steps: [] } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.createVersion).toHaveBeenCalledWith('wf-1', { dsl: { steps: [] } });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workflows', 'wf-1', 'versions'] });
    });
  });

  // ---- usePublishVersion ----

  describe('usePublishVersion()', () => {
    it('publishes a version and invalidates the versions query', async () => {
      vi.mocked(api.publishVersion).mockResolvedValue({});
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => usePublishVersion(), { wrapper });

      result.current.mutate({ workflowId: 'wf-1', version: 2 });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(api.publishVersion).toHaveBeenCalledWith('wf-1', 2);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workflows', 'wf-1', 'versions'] });
    });
  });

  // ---- useCompileWorkflow ----

  describe('useCompileWorkflow()', () => {
    it('exposes mutate function and calls api.compileWorkflow', async () => {
      const compiled = { ir: 'compiled-output' };
      vi.mocked(api.compileWorkflow).mockResolvedValue(compiled);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useCompileWorkflow(), { wrapper });

      expect(typeof result.current.mutate).toBe('function');

      result.current.mutate({ dsl: { steps: ['a'] } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(compiled);
    });
  });

  // ---- useValidateWorkflow ----

  describe('useValidateWorkflow()', () => {
    it('exposes mutate function and calls api.validateWorkflow', async () => {
      const validation = { valid: true, errors: [] };
      vi.mocked(api.validateWorkflow).mockResolvedValue(validation);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useValidateWorkflow(), { wrapper });

      result.current.mutate({ dsl: { steps: [] } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(validation);
    });
  });
});
