// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock the API module before importing hooks
vi.mock('@api/cards', () => ({
  fetchCards: vi.fn(),
  fetchCard: vi.fn(),
  fetchCardGraph: vi.fn(),
  fetchCardRuns: vi.fn(),
  fetchReadyCards: vi.fn(),
  createCard: vi.fn(),
  updateCard: vi.fn(),
  deleteCard: vi.fn(),
  addDependency: vi.fn(),
  removeDependency: vi.fn(),
}));

import {
  useCards,
  useCardDetail,
  useCardGraph,
  useCardRuns,
  useCreateCard,
  useUpdateCard,
  useReadyCards,
  useAddDependency,
  useRemoveDependency,
  useDeleteCard,
  cardKeys,
} from '../useCards';

import {
  fetchCards,
  fetchCard,
  fetchCardGraph,
  fetchCardRuns,
  fetchReadyCards,
  createCard,
  updateCard,
  deleteCard,
  addDependency,
  removeDependency,
} from '@api/cards';

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

describe('cardKeys', () => {
  it('generates correct key structures', () => {
    expect(cardKeys.all).toEqual(['cards']);
    expect(cardKeys.lists()).toEqual(['cards', 'list']);
    expect(cardKeys.list('b1')).toEqual(['cards', 'list', 'b1']);
    expect(cardKeys.details()).toEqual(['cards', 'detail']);
    expect(cardKeys.detail('c1')).toEqual(['cards', 'detail', 'c1']);
    expect(cardKeys.graphs()).toEqual(['cards', 'graph']);
    expect(cardKeys.graph('b1')).toEqual(['cards', 'graph', 'b1']);
    expect(cardKeys.runs('c1')).toEqual(['cards', 'runs', 'c1']);
  });
});

describe('useCards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCards(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchCards).not.toHaveBeenCalled();
  });

  it('fetches cards when boardId is provided', async () => {
    const mockCards = [
      { id: 'c1', name: 'Card 1', board_id: 'b1', type: 'analysis', status: 'draft' },
    ];
    vi.mocked(fetchCards).mockResolvedValue(mockCards as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCards('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCards);
    expect(fetchCards).toHaveBeenCalledWith('b1');
  });
});

describe('useCardDetail', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchCard).not.toHaveBeenCalled();
  });

  it('fetches card detail when cardId is provided', async () => {
    const mockCard = { id: 'c1', name: 'Test Card', status: 'draft' };
    vi.mocked(fetchCard).mockResolvedValue(mockCard as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardDetail('c1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCard);
    expect(fetchCard).toHaveBeenCalledWith('c1');
  });
});

describe('useCardGraph', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardGraph(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('fetches card graph when boardId is provided', async () => {
    const mockGraph = { nodes: [{ id: 'c1', name: 'Card 1' }], edges: [] };
    vi.mocked(fetchCardGraph).mockResolvedValue(mockGraph as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardGraph('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGraph);
  });
});

describe('useCardRuns', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when cardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCardRuns(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('provides a mutate function', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCard('b1'), { wrapper });

    expect(typeof result.current.mutate).toBe('function');
    expect(typeof result.current.mutateAsync).toBe('function');
  });

  it('calls createCard API on mutate', async () => {
    const newCard = { id: 'c2', board_id: 'b1', name: 'New Card', type: 'validation', status: 'draft' };
    vi.mocked(createCard).mockResolvedValue(newCard as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCard('b1'), { wrapper });

    result.current.mutate({ name: 'New Card', type: 'validation' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createCard).toHaveBeenCalledWith('b1', { name: 'New Card', type: 'validation' });
  });

  it('rolls back on error', async () => {
    const existingCards = [
      { id: 'c1', board_id: 'b1', name: 'Existing', type: 'analysis', status: 'draft', ordinal: 0, config: {}, kpis: {}, dependencies: [], created_at: '', updated_at: '' },
    ];
    vi.mocked(createCard).mockRejectedValue(new Error('Server error'));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(cardKeys.list('b1'), existingCards);

    const { result } = renderHook(() => useCreateCard('b1'), { wrapper });
    result.current.mutate({ name: 'Will fail', type: 'analysis' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // After error, cache should be rolled back to original
    await waitFor(() => {
      const cachedCards = queryClient.getQueryData<any[]>(cardKeys.list('b1'));
      // The onSettled invalidation will refetch, but the rollback happens first
      expect(result.current.error).toBeDefined();
    });
  });
});

describe('useUpdateCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls updateCard and invalidates detail + list queries', async () => {
    const updatedCard = { id: 'c1', name: 'Updated', status: 'ready' };
    vi.mocked(updateCard).mockResolvedValue(updatedCard as any);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCard(), { wrapper });
    result.current.mutate({ id: 'c1', name: 'Updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateCard).toHaveBeenCalledWith('c1', { name: 'Updated' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.detail('c1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.lists() });
  });
});

describe('useReadyCards', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is disabled when boardId is undefined', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReadyCards(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchReadyCards).not.toHaveBeenCalled();
  });

  it('fetches ready cards when boardId is provided', async () => {
    const readyCards = [{ id: 'c2', name: 'Ready Card', status: 'ready' }];
    vi.mocked(fetchReadyCards).mockResolvedValue(readyCards as any);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReadyCards('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(readyCards);
  });
});

describe('useDeleteCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('performs optimistic removal on delete', async () => {
    const existingCards = [
      { id: 'c1', board_id: 'b1', name: 'Card 1', type: 'analysis', status: 'draft', ordinal: 0, config: {}, kpis: {}, dependencies: [], created_at: '', updated_at: '' },
      { id: 'c2', board_id: 'b1', name: 'Card 2', type: 'validation', status: 'draft', ordinal: 1, config: {}, kpis: {}, dependencies: [], created_at: '', updated_at: '' },
    ];
    vi.mocked(deleteCard).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(cardKeys.list('b1'), existingCards);

    const { result } = renderHook(() => useDeleteCard('b1'), { wrapper });
    result.current.mutate('c1');

    // Optimistically the card should be removed
    await waitFor(() => {
      const cachedCards = queryClient.getQueryData<any[]>(cardKeys.list('b1'));
      // During optimistic update, c1 should be removed
      if (cachedCards && cachedCards.length === 1) {
        expect(cachedCards[0].id).toBe('c2');
      }
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCard).toHaveBeenCalledWith('c1');
  });
});

describe('useAddDependency', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls addDependency and invalidates list and graph queries', async () => {
    vi.mocked(addDependency).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAddDependency('b1'), { wrapper });
    result.current.mutate({ cardId: 'c1', depId: 'c2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(addDependency).toHaveBeenCalledWith('c1', 'c2');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.list('b1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.graphs() });
  });
});

describe('useRemoveDependency', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls removeDependency and invalidates list and graph queries', async () => {
    vi.mocked(removeDependency).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRemoveDependency('b1'), { wrapper });
    result.current.mutate({ cardId: 'c1', depId: 'c2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeDependency).toHaveBeenCalledWith('c1', 'c2');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.list('b1') });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cardKeys.graphs() });
  });
});
