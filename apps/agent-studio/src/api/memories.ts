import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelAgentMemory } from '@airaie/shared';

export async function listMemories(agentId: string) {
  const { data } = await apiClient.get<KernelAgentMemory[]>(ENDPOINTS.AGENTS.MEMORIES(agentId));
  return data;
}

export async function getMemory(agentId: string, memoryId: string) {
  const { data } = await apiClient.get<KernelAgentMemory>(ENDPOINTS.AGENTS.MEMORY(agentId, memoryId));
  return data;
}

export async function createMemory(agentId: string, body: { memory_type: string; content: string; tags?: string[] }) {
  const { data } = await apiClient.post<KernelAgentMemory>(ENDPOINTS.AGENTS.MEMORIES(agentId), body);
  return data;
}

export async function deleteMemory(agentId: string, memoryId: string) {
  await apiClient.delete(ENDPOINTS.AGENTS.MEMORY(agentId, memoryId));
}
