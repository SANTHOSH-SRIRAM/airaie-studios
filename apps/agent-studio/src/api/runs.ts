import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelRun, KernelNodeRun } from '@airaie/shared';

export async function listRuns(params?: { status?: string; limit?: number; offset?: number }) {
  const { data } = await apiClient.get<KernelRun[]>(ENDPOINTS.RUNS.LIST, { params });
  return data;
}

export async function getRun(id: string) {
  const { data } = await apiClient.get<KernelRun>(ENDPOINTS.RUNS.GET(id));
  return data;
}

export async function getRunLogs(id: string) {
  const { data } = await apiClient.get<KernelNodeRun[]>(ENDPOINTS.RUNS.LOGS(id));
  return data;
}

export async function getRunEvents(id: string) {
  const { data } = await apiClient.get(ENDPOINTS.RUNS.EVENTS(id));
  return data;
}
