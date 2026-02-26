import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/memories';

const KEYS = {
  all: (agentId: string) => ['memories', agentId] as const,
  detail: (agentId: string, mid: string) => ['memories', agentId, mid] as const,
};

export function useMemories(agentId: string) {
  return useQuery({
    queryKey: KEYS.all(agentId),
    queryFn: () => api.listMemories(agentId),
    enabled: !!agentId,
  });
}

export function useMemory(agentId: string, memoryId: string) {
  return useQuery({
    queryKey: KEYS.detail(agentId, memoryId),
    queryFn: () => api.getMemory(agentId, memoryId),
    enabled: !!agentId && !!memoryId,
  });
}

export function useCreateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      ...body
    }: {
      agentId: string;
      memory_type: string;
      content: string;
      tags?: string[];
    }) => api.createMemory(agentId, body),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.all(agentId) }),
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, memoryId }: { agentId: string; memoryId: string }) =>
      api.deleteMemory(agentId, memoryId),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.all(agentId) }),
  });
}
