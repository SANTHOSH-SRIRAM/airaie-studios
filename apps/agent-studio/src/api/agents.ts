import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelAgent, KernelAgentVersion, KernelRun } from '@airaie/shared';

export async function listAgents() {
  const { data } = await apiClient.get<KernelAgent[]>(ENDPOINTS.AGENTS.LIST);
  return data;
}

export async function getAgent(id: string) {
  const { data } = await apiClient.get<KernelAgent>(ENDPOINTS.AGENTS.GET(id));
  return data;
}

export async function createAgent(body: { name: string; description?: string; owner: string }) {
  const { data } = await apiClient.post<KernelAgent>(ENDPOINTS.AGENTS.CREATE, body);
  return data;
}

export async function deleteAgent(id: string) {
  await apiClient.delete(ENDPOINTS.AGENTS.DELETE(id));
}

export async function listVersions(agentId: string) {
  const { data } = await apiClient.get<KernelAgentVersion[]>(ENDPOINTS.AGENTS.VERSIONS(agentId));
  return data;
}

export async function getVersion(agentId: string, version: number) {
  const { data } = await apiClient.get<KernelAgentVersion>(ENDPOINTS.AGENTS.VERSION(agentId, version));
  return data;
}

export async function createVersion(agentId: string, body: { spec: Record<string, unknown> }) {
  const { data } = await apiClient.post<KernelAgentVersion>(ENDPOINTS.AGENTS.VERSIONS(agentId), body);
  return data;
}

export async function validateVersion(agentId: string, version: number): Promise<KernelAgentVersion> {
  const { data } = await apiClient.post<KernelAgentVersion>(ENDPOINTS.AGENTS.VALIDATE(agentId, version));
  return data;
}

export async function publishVersion(agentId: string, version: number): Promise<KernelAgentVersion> {
  const { data } = await apiClient.post<KernelAgentVersion>(ENDPOINTS.AGENTS.PUBLISH(agentId, version));
  return data;
}

export async function runAgent(
  agentId: string,
  version: number,
  body: { inputs: Record<string, unknown>; dry_run?: boolean }
) {
  const { data } = await apiClient.post<KernelRun>(ENDPOINTS.AGENTS.RUN(agentId, version), body);
  return data;
}
