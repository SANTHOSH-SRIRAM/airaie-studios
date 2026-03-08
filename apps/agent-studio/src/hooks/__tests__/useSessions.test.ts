import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useSessions,
  useSession,
  useCreateSession,
  useSendMessage,
  useRunInSession,
  useCloseSession,
  useApproveAction,
} from '../useSessions';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@api/sessions', () => ({
  listSessions: vi.fn(),
  getSession: vi.fn(),
  createSession: vi.fn(),
  sendMessage: vi.fn(),
  runInSession: vi.fn(),
  closeSession: vi.fn(),
  approveAction: vi.fn(),
}));

import * as api from '@api/sessions';

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
describe('useSessions', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches sessions for a given agent', async () => {
    const sessions = [{ id: 's1' }, { id: 's2' }];
    mockedApi.listSessions.mockResolvedValueOnce(sessions as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSessions('a1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sessions);
    expect(mockedApi.listSessions).toHaveBeenCalledWith('a1');
  });

  it('uses query key ["sessions", agentId]', async () => {
    mockedApi.listSessions.mockResolvedValueOnce([]);
    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useSessions('a1'), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['sessions', 'a1'])?.status).toBe('success'),
    );
  });

  it('does not fetch when agentId is empty (enabled: !!agentId)', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSessions(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.listSessions).not.toHaveBeenCalled();
  });
});

describe('useSession', () => {
  afterEach(() => vi.clearAllMocks());

  it('fetches a single session', async () => {
    const session = { id: 's1', agent_id: 'a1', messages: [] };
    mockedApi.getSession.mockResolvedValueOnce(session as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSession('a1', 's1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(session);
    expect(mockedApi.getSession).toHaveBeenCalledWith('a1', 's1');
  });

  it('does not fetch when agentId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSession('', 's1'), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.getSession).not.toHaveBeenCalled();
  });

  it('does not fetch when sessionId is empty', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSession('a1', ''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.getSession).not.toHaveBeenCalled();
  });

  it('uses query key ["sessions", agentId, sessionId]', async () => {
    mockedApi.getSession.mockResolvedValueOnce({ id: 's1' } as any);
    const { Wrapper, queryClient } = createWrapper();

    renderHook(() => useSession('a1', 's1'), { wrapper: Wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(['sessions', 'a1', 's1'])?.status).toBe('success'),
    );
  });
});

describe('useCreateSession', () => {
  afterEach(() => vi.clearAllMocks());

  it('creates a session and invalidates session list', async () => {
    const newSession = { id: 's-new', agent_id: 'a1' };
    mockedApi.createSession.mockResolvedValueOnce(newSession as any);
    mockedApi.listSessions.mockResolvedValue([]);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // Prime the sessions list cache
    renderHook(() => useSessions('a1'), { wrapper: Wrapper });
    await waitFor(() =>
      expect(queryClient.getQueryState(['sessions', 'a1'])?.status).toBe('success'),
    );

    const { result } = renderHook(() => useCreateSession(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', context: { foo: 'bar' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.createSession).toHaveBeenCalledWith('a1', { context: { foo: 'bar' } });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions', 'a1'] }),
    );
  });

  it('passes undefined body when no context provided', async () => {
    mockedApi.createSession.mockResolvedValueOnce({ id: 's2' } as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateSession(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.createSession).toHaveBeenCalledWith('a1', undefined);
  });
});

describe('useSendMessage', () => {
  afterEach(() => vi.clearAllMocks());

  it('sends a message and invalidates session detail', async () => {
    mockedApi.sendMessage.mockResolvedValueOnce({ id: 's1' } as any);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSendMessage(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', sessionId: 's1', content: 'hello' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.sendMessage).toHaveBeenCalledWith('a1', 's1', { content: 'hello' });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions', 'a1', 's1'] }),
    );
  });
});

describe('useRunInSession', () => {
  afterEach(() => vi.clearAllMocks());

  it('runs agent in session and invalidates session on success', async () => {
    const run = { id: 'run-1', status: 'running' };
    mockedApi.runInSession.mockResolvedValueOnce(run as any);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRunInSession(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      sessionId: 's1',
      inputs: { prompt: 'test' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(run);
    expect(mockedApi.runInSession).toHaveBeenCalledWith('a1', 's1', { inputs: { prompt: 'test' } });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions', 'a1', 's1'] }),
    );
  });
});

describe('useCloseSession', () => {
  afterEach(() => vi.clearAllMocks());

  it('closes a session and invalidates session detail', async () => {
    mockedApi.closeSession.mockResolvedValueOnce({ id: 's1', status: 'closed' } as any);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCloseSession(), { wrapper: Wrapper });

    result.current.mutate({ agentId: 'a1', sessionId: 's1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.closeSession).toHaveBeenCalledWith('a1', 's1');
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions', 'a1', 's1'] }),
    );
  });
});

describe('useApproveAction', () => {
  afterEach(() => vi.clearAllMocks());

  it('approves an action and invalidates session detail', async () => {
    mockedApi.approveAction.mockResolvedValueOnce({ action_id: 'act-1', decision: 'approve' } as any);

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useApproveAction(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      sessionId: 's1',
      actionId: 'act-1',
      decision: 'approve',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.approveAction).toHaveBeenCalledWith('a1', 's1', {
      action_id: 'act-1',
      decision: 'approve',
    });
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['sessions', 'a1', 's1'] }),
    );
  });

  it('supports reject decision', async () => {
    mockedApi.approveAction.mockResolvedValueOnce({ action_id: 'act-2', decision: 'reject' } as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useApproveAction(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      sessionId: 's1',
      actionId: 'act-2',
      decision: 'reject',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.approveAction).toHaveBeenCalledWith('a1', 's1', {
      action_id: 'act-2',
      decision: 'reject',
    });
  });
});
