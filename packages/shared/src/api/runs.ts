import { apiClient } from './client';
import { ENDPOINTS } from '../constants/api';
import type { KernelRun, KernelNodeRun } from '../types/kernel';

export interface RunListParams {
  status?: string;
  limit?: number;
  offset?: number;
  run_type?: string;
}

export async function listRuns(params?: RunListParams) {
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

export async function cancelRun(id: string) {
  const { data } = await apiClient.post<KernelRun>(ENDPOINTS.RUNS.CANCEL(id));
  return data;
}
