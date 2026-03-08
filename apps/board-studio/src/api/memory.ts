// ============================================================
// Agent Memory API
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { AgentMemory, MemoryType } from '@/types/execution';

export interface MemoryListParams {
  type?: MemoryType;
}

export async function fetchAgentMemories(
  agentId: string,
  params?: MemoryListParams
): Promise<AgentMemory[]> {
  try {
    const { data } = await apiClient.get<{ memories: AgentMemory[] }>(
      KERNEL_ENDPOINTS.AGENTS.MEMORIES(agentId),
      { params }
    );
    return data.memories ?? [];
  } catch {
    return [];
  }
}

export async function createAgentMemory(
  agentId: string,
  payload: { type: MemoryType; content: string; metadata?: Record<string, unknown> }
): Promise<AgentMemory> {
  const { data } = await apiClient.post<AgentMemory>(
    KERNEL_ENDPOINTS.AGENTS.MEMORIES(agentId),
    payload
  );
  return data;
}

export async function deleteAgentMemory(
  agentId: string,
  memoryId: string
): Promise<void> {
  await apiClient.delete(KERNEL_ENDPOINTS.AGENTS.MEMORY(agentId, memoryId));
}
