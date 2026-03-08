import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/triggers';

const KEYS = {
  all: (workflowId: string) => ['triggers', workflowId] as const,
  detail: (workflowId: string, triggerId: string) => ['triggers', workflowId, triggerId] as const,
};

export function useTriggers(workflowId: string) {
  return useQuery({
    queryKey: KEYS.all(workflowId),
    queryFn: () => api.listTriggers(workflowId),
    enabled: !!workflowId,
  });
}

export function useTrigger(workflowId: string, triggerId: string) {
  return useQuery({
    queryKey: KEYS.detail(workflowId, triggerId),
    queryFn: () => api.getTrigger(workflowId, triggerId),
    enabled: !!workflowId && !!triggerId,
  });
}

export function useCreateTrigger(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; config: Record<string, unknown>; enabled: boolean }) =>
      api.createTrigger(workflowId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all(workflowId) }),
  });
}

export function useUpdateTrigger(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ triggerId, ...body }: { triggerId: string; type?: string; config?: Record<string, unknown>; enabled?: boolean }) =>
      api.updateTrigger(workflowId, triggerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all(workflowId) }),
  });
}

export function useDeleteTrigger(workflowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (triggerId: string) => api.deleteTrigger(workflowId, triggerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all(workflowId) }),
  });
}
