// ============================================================
// TanStack Query hooks for card API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCards,
  fetchCard,
  fetchCardGraph,
  fetchCardRuns,
  createCard,
  updateCard,
} from '@api/cards';

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
    }) => createCard(boardId, payload),
    onSuccess: () => {
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
