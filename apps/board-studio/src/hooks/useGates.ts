// ============================================================
// TanStack Query hooks for gate API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGates, fetchGate, approveGate, rejectGate, waiveGate } from '@api/gates';

// --- Query key factories ---

export const gateKeys = {
  all: ['gates'] as const,
  lists: () => [...gateKeys.all, 'list'] as const,
  list: (boardId: string) => [...gateKeys.lists(), boardId] as const,
  details: () => [...gateKeys.all, 'detail'] as const,
  detail: (id: string) => [...gateKeys.details(), id] as const,
};

// --- Queries ---

export function useGates(boardId: string | undefined) {
  return useQuery({
    queryKey: gateKeys.list(boardId!),
    queryFn: () => fetchGates(boardId!),
    enabled: !!boardId,
  });
}

export function useGateDetail(gateId: string | undefined) {
  return useQuery({
    queryKey: gateKeys.detail(gateId!),
    queryFn: () => fetchGate(gateId!),
    enabled: !!gateId,
  });
}

// --- Mutations ---

export function useApproveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, comment }: { gateId: string; comment?: string }) =>
      approveGate(gateId, { comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}

export function useRejectGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, reason }: { gateId: string; reason: string }) =>
      rejectGate(gateId, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}

export function useWaiveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, reason }: { gateId: string; reason?: string }) =>
      waiveGate(gateId, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}
