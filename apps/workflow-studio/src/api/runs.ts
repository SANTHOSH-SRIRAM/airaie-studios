import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelRun, KernelNodeRun, KernelArtifact } from '@airaie/shared';

export async function listRuns(params?: { status?: string; limit?: number; offset?: number }) {
  const { data } = await apiClient.get<KernelRun[]>(ENDPOINTS.RUNS.LIST, { params });
  return data;
}

export async function getRun(id: string) {
  const { data } = await apiClient.get<KernelRun>(ENDPOINTS.RUNS.GET(id));
  return data;
}

export async function startRun(body: {
  workflow_id: string;
  workflow_version: number;
  inputs: Record<string, unknown>;
}) {
  const { data } = await apiClient.post<KernelRun>(ENDPOINTS.RUNS.START, {
    run_type: 'workflow',
    ...body,
  });
  return data;
}

export async function cancelRun(id: string) {
  const { data } = await apiClient.post(ENDPOINTS.RUNS.CANCEL(id));
  return data;
}

export async function resumeRun(id: string) {
  const { data } = await apiClient.post(ENDPOINTS.RUNS.RESUME(id));
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

export async function getRunArtifacts(id: string) {
  const { data } = await apiClient.get<KernelArtifact[]>(ENDPOINTS.RUNS.ARTIFACTS(id));
  return data;
}
