// Common run API functions are now in @airaie/shared (listRuns, getRun, getRunLogs, cancelRun)
// This file only keeps agent-studio-specific API functions.

import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelAuditEvent } from '@airaie/shared';

export async function getRunEvents(id: string): Promise<KernelAuditEvent[]> {
  const { data } = await apiClient.get<KernelAuditEvent[]>(ENDPOINTS.RUNS.EVENTS(id));
  return data;
}

export async function getRunTrace(id: string, verbosity?: 'minimal' | 'normal' | 'verbose') {
  const params = verbosity ? { verbosity } : undefined;
  const { data } = await apiClient.get<KernelAuditEvent[]>(ENDPOINTS.RUNS.TRACE(id), { params });
  return data;
}
