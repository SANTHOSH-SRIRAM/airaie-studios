// ============================================================
// TanStack Query hooks for card API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { Card } from '@/types/board';

// --- Query key factories ---

export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (boardId: string) => [...cardKeys.lists(), boardId] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  graphs: () => [...cardKeys.all, 'graph'] as const,
  graph: (boardId: string) => [...cardKeys.graphs(), boardId] as const,
  runs: (cardId: string) => [...cardKeys.all, 'runs', cardId] as const,
};

// --- Queries ---

export function useCards(boardId: string | undefined) {
  return useQuery({
    queryKey: cardKeys.list(boardId!),
    queryFn: () => fetchCards(boardId!),
    enabled: !!boardId,
  });
}

export function useCardDetail(cardId: string | undefined) {
  return useQuery({
    queryKey: cardKeys.detail(cardId!),
    queryFn: () => fetchCard(cardId!),
    enabled: !!cardId,
  });
}

export function useCardGraph(boardId: string | undefined) {
  return useQuery({
    queryKey: cardKeys.graph(boardId!),
    queryFn: () => fetchCardGraph(boardId!),
    enabled: !!boardId,
  });
}

export function useCardRuns(cardId: string | undefined) {
  return useQuery({
    queryKey: cardKeys.runs(cardId!),
    queryFn: () => fetchCardRuns(cardId!),
    enabled: !!cardId,
  });
}

// --- Mutations ---

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      type: string;
      description?: string;
      dependencies?: string[];
      intent_type?: string;
      config?: Record<string, unknown>;
    }) => createCard(boardId, payload),
    onMutate: async (payload) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: cardKeys.list(boardId) });

      // Snapshot the previous value
      const previousCards = qc.getQueryData<Card[]>(cardKeys.list(boardId));

      // Optimistically add a placeholder card
      if (previousCards) {
        const placeholderCard: Card = {
          id: `optimistic-${Date.now()}`,
          board_id: boardId,
          name: payload.name,
          type: payload.type as Card['type'],
          description: payload.description,
          status: 'draft',
          ordinal: previousCards.length,
          config: {},
          kpis: {},
          dependencies: payload.dependencies ?? [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        qc.setQueryData<Card[]>(cardKeys.list(boardId), [...previousCards, placeholderCard]);
      }

      return { previousCards };
    },
    onError: (_err, _payload, context) => {
      // Roll back to previous value on error
      if (context?.previousCards) {
        qc.setQueryData<Card[]>(cardKeys.list(boardId), context.previousCards);
      }
    },
    onSettled: () => {
      // Always refetch to get the real server state
      qc.invalidateQueries({ queryKey: cardKeys.list(boardId) });
      qc.invalidateQueries({ queryKey: cardKeys.graph(boardId) });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & Partial<
      Pick<
        import('@/types/board').Card,
        'name' | 'status' | 'config' | 'kpis'
      >
    >) => updateCard(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: cardKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}

export function useReadyCards(boardId: string | undefined) {
  return useQuery({
    queryKey: [...cardKeys.list(boardId!), 'ready'] as const,
    queryFn: () => fetchReadyCards(boardId!),
    enabled: !!boardId,
  });
}

export function useAddDependency(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, depId }: { cardId: string; depId: string }) =>
      addDependency(cardId, depId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.list(boardId) });
      qc.invalidateQueries({ queryKey: cardKeys.graphs() });
    },
  });
}

export function useRemoveDependency(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, depId }: { cardId: string; depId: string }) =>
      removeDependency(cardId, depId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.list(boardId) });
      qc.invalidateQueries({ queryKey: cardKeys.graphs() });
    },
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onMutate: async (cardId) => {
      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: cardKeys.list(boardId) });

      // Snapshot the previous value
      const previousCards = qc.getQueryData<Card[]>(cardKeys.list(boardId));

      // Optimistically remove the card from the list
      if (previousCards) {
        qc.setQueryData<Card[]>(
          cardKeys.list(boardId),
          previousCards.filter((c) => c.id !== cardId),
        );
      }

      return { previousCards };
    },
    onError: (_err, _cardId, context) => {
      // Roll back on error
      if (context?.previousCards) {
        qc.setQueryData<Card[]>(cardKeys.list(boardId), context.previousCards);
      }
    },
    onSettled: () => {
      // Always refetch to get the real server state
      qc.invalidateQueries({ queryKey: cardKeys.list(boardId) });
      qc.invalidateQueries({ queryKey: cardKeys.graph(boardId) });
    },
  });
}
