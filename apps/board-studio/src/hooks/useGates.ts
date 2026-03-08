// ============================================================
// TanStack Query hooks for gate API
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGates, fetchGate, evaluateGate, approveGate, rejectGate, waiveGate } from '@api/gates';

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
    // Poll every 3s while gate is evaluating, stop when resolved
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'EVALUATING' ? 3000 : false;
    },
  });
}

// --- Mutations ---

export function useEvaluateGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gateId: string) => evaluateGate(gateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}

export function useApproveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, role }: { gateId: string; role?: string }) =>
      approveGate(gateId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}

export function useRejectGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, rationale }: { gateId: string; rationale: string }) =>
      rejectGate(gateId, { rationale }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}

export function useWaiveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, rationale }: { gateId: string; rationale: string }) =>
      waiveGate(gateId, { rationale }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gateKeys.all });
    },
  });
}
