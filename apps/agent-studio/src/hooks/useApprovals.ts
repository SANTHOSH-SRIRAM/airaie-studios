import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/approvals';

const KEYS = {
  all: ['approvals'] as const,
  list: (status?: string) => ['approvals', { status }] as const,
  detail: (id: string) => ['approvals', id] as const,
};

export function useApprovals(status?: string) {
  return useQuery({
    queryKey: KEYS.list(status),
    queryFn: () => api.listApprovals(status ? { status } : undefined),
  });
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.getApproval(id),
    enabled: !!id,
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      api.approveRequest(id, { comment }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectRequest(id, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
