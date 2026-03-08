import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAgents,
  useAgent,
  useCreateAgent,
  useDeleteAgent,
  useAgentVersions,
  useAgentVersion,
  useCreateAgentVersion,
  usePublishAgentVersion,
} from '../useAgents';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@api/agents', () => ({
  listAgents: vi.fn(),
  getAgent: vi.fn(),
  createAgent: vi.fn(),
  deleteAgent: vi.fn(),
  listVersions: vi.fn(),
  getVersion: vi.fn(),
  createVersion: vi.fn(),
  validateVersion: vi.fn(),
  publishVersion: vi.fn(),
  runAgent: vi.fn(),
}));

import * as api from '@api/agents';

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('useAgents', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches the full agent list', async () => {
    const agents = [{ id: 'a1', name: 'Bot' }];
    mockedApi.listAgents.mockResolvedValueOnce(agents as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgents(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(agents);
    expect(mockedApi.listAgents).toHaveBeenCalledOnce();
  });

  it('uses the correct query key ["agents"]', async () => {
    mockedApi.listAgents.mockResolvedValueOnce([]);
    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useAgents(), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['agents'])?.status).toBe('success'),
    );
  });
});

describe('useAgent', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a single agent by id', async () => {
    const agent = { id: 'a1', name: 'Bot' };
    mockedApi.getAgent.mockResolvedValueOnce(agent as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgent('a1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(agent);
    expect(mockedApi.getAgent).toHaveBeenCalledWith('a1');
  });

  it('does not fetch when id is empty string (enabled: !!id)', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgent(''), { wrapper: Wrapper });

    // Should stay in idle / pending-but-not-fetching state
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.getAgent).not.toHaveBeenCalled();
  });

  it('uses query key ["agents", id]', async () => {
    mockedApi.getAgent.mockResolvedValueOnce({ id: 'a2' } as any);
    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useAgent('a2'), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['agents', 'a2'])?.status).toBe('success'),
    );
  });
});

describe('useCreateAgent', () => {
  afterEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateAgent(), { wrapper: Wrapper });

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('invalidates the agents list on success', async () => {
    const created = { id: 'new', name: 'NewBot' };
    mockedApi.createAgent.mockResolvedValueOnce(created as any);
    mockedApi.listAgents.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Prime the agents cache so invalidation has something to target
    renderHook(() => useAgents(), { wrapper: Wrapper });
    await waitFor(() =>
      expect(queryClient.getQueryState(['agents'])?.status).toBe('success'),
    );

    const { result } = renderHook(() => useCreateAgent(), { wrapper: Wrapper });

    result.current.mutate({ name: 'NewBot', owner: 'user1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents'] }),
    );
  });
});

describe('useDeleteAgent', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls deleteAgent and invalidates agents list on success', async () => {
    mockedApi.deleteAgent.mockResolvedValueOnce(undefined as any);

    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useDeleteAgent(), { wrapper: Wrapper });

    result.current.mutate('a1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useAgentVersions', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches versions for a given agent', async () => {
    const versions = [{ version: 1 }, { version: 2 }];
    mockedApi.listVersions.mockResolvedValueOnce(versions as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentVersions('a1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(versions);
    expect(mockedApi.listVersions).toHaveBeenCalledWith('a1');
  });

  it('does not fetch when agentId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentVersions(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.listVersions).not.toHaveBeenCalled();
  });
});

describe('useAgentVersion', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a specific version', async () => {
    const version = { version: 3, spec: {} };
    mockedApi.getVersion.mockResolvedValueOnce(version as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentVersion('a1', 3), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.getVersion).toHaveBeenCalledWith('a1', 3);
  });

  it('does not fetch when version is 0 (enabled: version > 0)', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentVersion('a1', 0), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.getVersion).not.toHaveBeenCalled();
  });

  it('does not fetch when agentId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useAgentVersion('', 1), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.getVersion).not.toHaveBeenCalled();
  });
});

describe('useCreateAgentVersion', () => {
  afterEach(() => vi.clearAllMocks());

  it('invalidates version list for the correct agent on success', async () => {
    mockedApi.createVersion.mockResolvedValueOnce({ version: 2 } as any);
    mockedApi.listVersions.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateAgentVersion(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', spec: { model: 'gpt-4' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.createVersion).toHaveBeenCalledWith('a1', { spec: { model: 'gpt-4' } });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents', 'a1', 'versions'] }),
    );
  });
});

describe('usePublishAgentVersion', () => {
  afterEach(() => vi.clearAllMocks());

  it('publishes a version and invalidates the version list', async () => {
    mockedApi.publishVersion.mockResolvedValueOnce({ version: 1, status: 'published' } as any);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePublishAgentVersion(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', version: 1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.publishVersion).toHaveBeenCalledWith('a1', 1);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['agents', 'a1', 'versions'] }),
    );
  });
});
