// ============================================================
// TanStack Query hooks for agent memory
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAgentMemories,
  createAgentMemory,
  deleteAgentMemory,
} from '@api/memory';
import type { MemoryListParams } from '@api/memory';
import type { AgentMemory, MemoryType } from '@/types/execution';

// --- Query key factories ---

export const memoryKeys = {
  all: ['agent-memories'] as const,
  list: (agentId: string, params?: MemoryListParams) =>
    [...memoryKeys.all, agentId, params] as const,
};

// --- Queries ---

export function useAgentMemories(
  agentId: string | undefined,
  params?: MemoryListParams
) {
  return useQuery<AgentMemory[]>({
    queryKey: memoryKeys.list(agentId!, params),
    queryFn: () => fetchAgentMemories(agentId!, params),
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

// --- Mutations ---

export function useCreateMemory(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      type: MemoryType;
      content: string;
      metadata?: Record<string, unknown>;
    }) => createAgentMemory(agentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memoryKeys.list(agentId) });
    },
  });
}

export function useDeleteMemory(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => deleteAgentMemory(agentId, memoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memoryKeys.list(agentId) });
    },
  });
}
