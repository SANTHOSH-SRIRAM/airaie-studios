// ============================================================
// TanStack Query hooks for board API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import type { BoardListParams } from '@/types/board';

// --- Query key factories ---

export const boardKeys = {
  all: ['boards'] as const,
  lists: () => [...boardKeys.all, 'list'] as const,
  list: (params: BoardListParams) => [...boardKeys.lists(), params] as const,
  details: () => [...boardKeys.all, 'detail'] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
  summaries: () => [...boardKeys.all, 'summary'] as const,
  summary: (id: string) => [...boardKeys.summaries(), id] as const,
  children: (id: string) => [...boardKeys.all, 'children', id] as const,
  templates: () => ['board-templates'] as const,
  verticals: () => ['verticals'] as const,
  intentTypes: (verticalSlug: string) => ['intent-types', verticalSlug] as const,
};

// --- Queries ---

export function useBoards(params: BoardListParams = {}) {
  return useQuery({
    queryKey: boardKeys.list(params),
    queryFn: () => fetchBoards(params),
  });
}

export function useBoardDetail(boardId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.detail(boardId!),
    queryFn: () => fetchBoard(boardId!),
    enabled: !!boardId,
  });
}

export function useBoardSummary(boardId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.summary(boardId!),
    queryFn: () => fetchBoardSummary(boardId!),
    enabled: !!boardId,
  });
}

export function useBoardChildren(boardId: string | undefined) {
  return useQuery({
    queryKey: boardKeys.children(boardId!),
    queryFn: () => fetchBoardChildren(boardId!),
    enabled: !!boardId,
  });
}

// --- Mutations ---

export function useCreateBoardFromIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBoardFromIntent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useCreateBoardFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBoardFromTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

// --- Templates & Intent Types ---

export function useBoardTemplates() {
  return useQuery({
    queryKey: boardKeys.templates(),
    queryFn: () => fetchBoardTemplates(),
  });
}

export function useVerticals() {
  return useQuery({
    queryKey: boardKeys.verticals(),
    queryFn: fetchVerticals,
  });
}

export function useIntentTypes(verticalSlug: string) {
  return useQuery({
    queryKey: boardKeys.intentTypes(verticalSlug),
    queryFn: () => fetchIntentTypes(verticalSlug),
    enabled: !!verticalSlug,
  });
}
