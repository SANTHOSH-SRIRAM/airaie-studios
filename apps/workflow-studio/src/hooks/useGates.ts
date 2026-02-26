import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/gates';

const KEYS = {
  all: ['gates'] as const,
  detail: (id: string) => ['gates', id] as const,
  requirements: (id: string) => ['gates', id, 'requirements'] as const,
  approvals: (id: string) => ['gates', id, 'approvals'] as const,
};

export function useGates(params?: { status?: string; limit?: number }) {
  return useQuery({ queryKey: [...KEYS.all, params], queryFn: () => api.listGates(params) });
}

export function useGate(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => api.getGate(id), enabled: !!id });
}

export function useGateRequirements(gateId: string) {
  return useQuery({
    queryKey: KEYS.requirements(gateId),
    queryFn: () => api.listRequirements(gateId),
    enabled: !!gateId,
  });
}

export function useGateApprovals(gateId: string) {
  return useQuery({
    queryKey: KEYS.approvals(gateId),
    queryFn: () => api.listApprovals(gateId),
    enabled: !!gateId,
  });
}

export function useApproveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rationale }: { id: string; rationale?: string }) =>
      api.approveGate(id, { rationale }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useRejectGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rationale }: { id: string; rationale?: string }) =>
      api.rejectGate(id, { rationale }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useWaiveGate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rationale }: { id: string; rationale?: string }) =>
      api.waiveGate(id, { rationale }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
