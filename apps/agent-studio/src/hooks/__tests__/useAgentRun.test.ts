import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRunAgent, useRunStream } from '../useAgentRun';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@api/agents', () => ({
  runAgent: vi.fn(),
}));

vi.mock('@airaie/shared', () => ({
  createRunStream: vi.fn(),
}));

import * as agentsApi from '@api/agents';
import { createRunStream } from '@airaie/shared';
import type { RunEvent } from '@airaie/shared';

const mockedRunAgent = vi.mocked(agentsApi.runAgent);
const mockedCreateRunStream = vi.mocked(createRunStream);

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
// useRunAgent tests
// ---------------------------------------------------------------------------
describe('useRunAgent', () => {
  afterEach(() => vi.clearAllMocks());

  it('provides mutate and mutateAsync functions', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRunAgent(), { wrapper: Wrapper });

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('calls runAgent API with correct parameters', async () => {
    const run = { id: 'run-1', status: 'running' };
    mockedRunAgent.mockResolvedValueOnce(run as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRunAgent(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      version: 2,
      inputs: { prompt: 'test' },
      dryRun: false,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedRunAgent).toHaveBeenCalledWith('a1', 2, {
      inputs: { prompt: 'test' },
      dry_run: false,
    });
    expect(result.current.data).toEqual(run);
  });

  it('passes dry_run flag correctly', async () => {
    mockedRunAgent.mockResolvedValueOnce({ id: 'run-dry', status: 'completed' } as any);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRunAgent(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      version: 1,
      inputs: {},
      dryRun: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedRunAgent).toHaveBeenCalledWith('a1', 1, {
      inputs: {},
      dry_run: true,
    });
  });

  it('handles API errors', async () => {
    mockedRunAgent.mockRejectedValueOnce(new Error('Server error'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRunAgent(), { wrapper: Wrapper });

    result.current.mutate({
      agentId: 'a1',
      version: 1,
      inputs: {},
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Server error');
  });
});

// ---------------------------------------------------------------------------
// useRunStream tests
// ---------------------------------------------------------------------------
describe('useRunStream', () => {
  afterEach(() => vi.clearAllMocks());

  it('does not create a stream when runId is null', () => {
    const { Wrapper } = createWrapper();
    const onEvent = vi.fn();

    renderHook(() => useRunStream(null, onEvent), { wrapper: Wrapper });

    expect(mockedCreateRunStream).not.toHaveBeenCalled();
  });

  it('creates a stream when runId is provided', () => {
    const cleanupFn = vi.fn();
    mockedCreateRunStream.mockReturnValueOnce(cleanupFn);

    const { Wrapper } = createWrapper();
    const onEvent = vi.fn();

    renderHook(() => useRunStream('run-1', onEvent), { wrapper: Wrapper });

    expect(mockedCreateRunStream).toHaveBeenCalledWith('run-1', expect.any(Function));
  });

  it('calls cleanup when unmounting', () => {
    const cleanupFn = vi.fn();
    mockedCreateRunStream.mockReturnValueOnce(cleanupFn);

    const { Wrapper } = createWrapper();
    const onEvent = vi.fn();

    const { unmount } = renderHook(() => useRunStream('run-1', onEvent), {
      wrapper: Wrapper,
    });

    unmount();

    expect(cleanupFn).toHaveBeenCalledOnce();
  });

  it('forwards events to the onEvent callback', () => {
    let capturedHandler: ((event: RunEvent) => void) | undefined;

    mockedCreateRunStream.mockImplementation((runId, handler) => {
      capturedHandler = handler;
      return vi.fn();
    });

    const { Wrapper } = createWrapper();
    const onEvent = vi.fn();

    renderHook(() => useRunStream('run-1', onEvent), { wrapper: Wrapper });

    const event: RunEvent = {
      event_id: 'e1',
      event_type: 'RUN_STARTED',
      timestamp: '2026-03-07T00:00:00Z',
      run_id: 'run-1',
      payload: {},
    };

    // Simulate the stream sending an event
    act(() => {
      capturedHandler!(event);
    });

    expect(onEvent).toHaveBeenCalledWith(event);
  });

  it('reconnects stream when runId changes', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    mockedCreateRunStream
      .mockReturnValueOnce(cleanup1)
      .mockReturnValueOnce(cleanup2);

    const { Wrapper } = createWrapper();
    const onEvent = vi.fn();

    const { rerender } = renderHook(
      ({ runId }: { runId: string | null }) => useRunStream(runId, onEvent),
      {
        wrapper: Wrapper,
        initialProps: { runId: 'run-1' },
      },
    );

    expect(mockedCreateRunStream).toHaveBeenCalledTimes(1);

    // Change the runId
    rerender({ runId: 'run-2' });

    // Old cleanup should have been called, new stream created
    expect(cleanup1).toHaveBeenCalledOnce();
    expect(mockedCreateRunStream).toHaveBeenCalledTimes(2);
    expect(mockedCreateRunStream).toHaveBeenLastCalledWith('run-2', expect.any(Function));
  });
});
