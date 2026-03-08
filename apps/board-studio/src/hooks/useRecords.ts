// ============================================================
// TanStack Query hooks for board records API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRecords, createRecord, deleteRecord } from '@api/records';
import type { RecordType } from '@/types/board';

// --- Query key factories ---

export const recordKeys = {
  all: ['records'] as const,
  lists: () => [...recordKeys.all, 'list'] as const,
  list: (boardId: string) => [...recordKeys.lists(), boardId] as const,
};

// --- Queries ---

export function useRecords(boardId: string | undefined) {
  return useQuery({
    queryKey: recordKeys.list(boardId!),
    queryFn: () => fetchRecords(boardId!),
    enabled: !!boardId,
  });
}

// --- Mutations ---

export function useCreateRecord(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type: RecordType; content: string; metadata?: Record<string, unknown> }) =>
      createRecord(boardId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.list(boardId) });
    },
  });
}

export function useDeleteRecord(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => deleteRecord(boardId, recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recordKeys.list(boardId) });
    },
  });
}
