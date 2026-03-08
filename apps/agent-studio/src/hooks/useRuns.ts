// Re-export common hooks from shared
export { useRuns, useRun, useRunLogs, useCancelRun, runKeys } from '@airaie/shared';

// Studio-specific hooks below

import { useQuery } from '@tanstack/react-query';
import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelAuditEvent } from '@airaie/shared';

export function useRunEvents(id: string) {
  return useQuery({
    queryKey: ['runs', id, 'events'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<KernelAuditEvent[]>(ENDPOINTS.RUNS.EVENTS(id));
      return data;
    },
    enabled: !!id,
  });
}

export function useRunTrace(id: string, verbosity?: 'minimal' | 'normal' | 'verbose') {
  return useQuery({
    queryKey: ['runs', id, 'trace', verbosity] as const,
    queryFn: async () => {
      const params = verbosity ? { verbosity } : undefined;
      const { data } = await apiClient.get<KernelAuditEvent[]>(ENDPOINTS.RUNS.TRACE(id), { params });
      return data;
    },
    enabled: !!id,
  });
}
