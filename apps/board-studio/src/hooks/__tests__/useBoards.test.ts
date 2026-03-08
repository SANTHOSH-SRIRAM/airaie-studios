// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/boards', () => ({
  fetchBoards: vi.fn(),
  fetchBoard: vi.fn(),
  fetchBoardSummary: vi.fn(),
  fetchBoardChildren: vi.fn(),
  createBoardFromIntent: vi.fn(),
  createBoardFromTemplate: vi.fn(),
  deleteBoard: vi.fn(),
  fetchBoardTemplates: vi.fn(),
  fetchVerticals: vi.fn(),
  fetchIntentTypes: vi.fn(),
}));

import {
  useBoards,
  useBoardDetail,
  useBoardSummary,
  useBoardChildren,
  useCreateBoardFromIntent,
  useCreateBoardFromTemplate,
  useDeleteBoard,
  useBoardTemplates,
  useVerticals,
  useIntentTypes,
  boardKeys,
} from '../useBoards';

import {
  fetchBoards,
  fetchBoard,
  fetchBoardSummary,
  fetchBoardChildren,
  createBoardFromIntent,
  createBoardFromTemplate,
  deleteBoard,
  fetchBoardTemplates,
  fetchVerticals,
  fetchIntentTypes,
} from '@api/boards';

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

describe('boardKeys', () => {
  it('generates correct key structures', () => {
    expect(boardKeys.all).toEqual(['boards']);
    expect(boardKeys.lists()).toEqual(['boards', 'list']);
    expect(boardKeys.list({ status: 'active' })).toEqual(['boards', 'list', { status: 'active' }]);
    expect(boardKeys.details()).toEqual(['boards', 'detail']);
    expect(boardKeys.detail('b1')).toEqual(['boards', 'detail', 'b1']);
    expect(boardKeys.summaries()).toEqual(['boards', 'summary']);
    expect(boardKeys.summary('b1')).toEqual(['boards', 'summary', 'b1']);
    expect(boardKeys.children('b1')).toEqual(['boards', 'children', 'b1']);
    expect(boardKeys.templates()).toEqual(['board-templates']);
    expect(boardKeys.verticals()).toEqual(['verticals']);
    expect(boardKeys.intentTypes('engineering')).toEqual(['intent-types', 'engineering']);
  });
});

describe('useBoards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches boards with default params', async () => {
    const mockBoards = [{ id: 'b1', name: 'Board 1' }];
    vi.mocked(fetchBoards).mockResolvedValue(mockBoards as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoards(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBoards);
    expect(fetchBoards).toHaveBeenCalledWith({});
  });

  it('passes params to fetchBoards', async () => {
    vi.mocked(fetchBoards).mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const params = { status: 'active' as const, limit: 10 };
    renderHook(() => useBoards(params), { wrapper });

    await waitFor(() => expect(fetchBoards).toHaveBeenCalledWith(params));
  });
});

describe('useBoardDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchBoard).not.toHaveBeenCalled();
  });

  it('fetches board detail when boardId is provided', async () => {
    const mockBoard = { id: 'b1', name: 'Board 1' };
    vi.mocked(fetchBoard).mockResolvedValue(mockBoard as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardDetail('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBoard);
    expect(fetchBoard).toHaveBeenCalledWith('b1');
  });
});

describe('useBoardSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardSummary(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchBoardSummary).not.toHaveBeenCalled();
  });

  it('fetches summary when boardId is provided', async () => {
    const mockSummary = { overall_readiness: 0.75 };
    vi.mocked(fetchBoardSummary).mockResolvedValue(mockSummary as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardSummary('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockSummary);
  });
});

describe('useBoardChildren', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardChildren(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateBoardFromIntent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateBoardFromIntent(), { wrapper });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('calls createBoardFromIntent and invalidates board queries on success', async () => {
    const mockBoard = { id: 'b-new', name: 'New Board' };
    vi.mocked(createBoardFromIntent).mockResolvedValue(mockBoard as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateBoardFromIntent(), { wrapper });

    result.current.mutate({
      name: 'New Board',
      intent_spec: { intent_type: 'design_review', goal: 'Review PCB' },
    } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createBoardFromIntent).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.all });
  });
});

describe('useDeleteBoard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls deleteBoard and invalidates queries on success', async () => {
    vi.mocked(deleteBoard).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteBoard(), { wrapper });
    result.current.mutate('b1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteBoard).toHaveBeenCalledWith('b1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: boardKeys.all });
  });
});

describe('useIntentTypes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when verticalSlug is empty string', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useIntentTypes(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchIntentTypes).not.toHaveBeenCalled();
  });

  it('fetches intent types when verticalSlug is provided', async () => {
    const mockIntents = [{ slug: 'design_review', name: 'Design Review' }];
    vi.mocked(fetchIntentTypes).mockResolvedValue(mockIntents as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useIntentTypes('engineering'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockIntents);
    expect(fetchIntentTypes).toHaveBeenCalledWith('engineering');
  });
});

describe('useBoardTemplates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches templates', async () => {
    const mockTemplates = [{ slug: 'pcb-design', name: 'PCB Design' }];
    vi.mocked(fetchBoardTemplates).mockResolvedValue(mockTemplates as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardTemplates(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTemplates);
  });
});

describe('useVerticals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches verticals', async () => {
    const mockVerticals = [{ slug: 'engineering', name: 'Engineering' }];
    vi.mocked(fetchVerticals).mockResolvedValue(mockVerticals as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useVerticals(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockVerticals);
  });
});
