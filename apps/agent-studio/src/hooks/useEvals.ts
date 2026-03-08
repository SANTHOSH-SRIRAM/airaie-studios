import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/evals';
import type { EvalCase } from '@api/evals';

const KEYS = {
  list: (agentId: string) => ['agents', agentId, 'evals'] as const,
  detail: (agentId: string, evalId: string) => ['agents', agentId, 'evals', evalId] as const,
};

export function useEvalCases(agentId: string) {
  return useQuery({
    queryKey: KEYS.list(agentId),
    queryFn: () => api.listEvalCases(agentId),
    enabled: !!agentId,
  });
}

export function useCreateEvalCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, ...body }: { agentId: string; name: string; inputs: Record<string, unknown>; criteria: Record<string, unknown> }) =>
      api.createEvalCase(agentId, body),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.list(agentId) }),
  });
}

export function useUpdateEvalCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, evalId, ...body }: { agentId: string; evalId: string; name?: string; inputs?: Record<string, unknown>; criteria?: Record<string, unknown> }) =>
      api.updateEvalCase(agentId, evalId, body),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.list(agentId) }),
  });
}

export function useDeleteEvalCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, evalId }: { agentId: string; evalId: string }) =>
      api.deleteEvalCase(agentId, evalId),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.list(agentId) }),
  });
}

export type { EvalCase };
