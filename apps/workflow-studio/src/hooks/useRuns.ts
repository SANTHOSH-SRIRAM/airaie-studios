// Re-export common hooks from shared
export { useRuns, useRun, useRunLogs, useCancelRun, runKeys } from '@airaie/shared';

// Studio-specific hooks below

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { createRunStream, ENDPOINTS, apiClient, runKeys } from '@airaie/shared';
import type { RunEvent, KernelRun, KernelArtifact } from '@airaie/shared';

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      workflow_id: string;
      workflow_version: number;
      inputs: Record<string, unknown>;
    }) => {
      return apiClient.post<KernelRun>(ENDPOINTS.RUNS.START, {
        run_type: 'workflow',
        ...body,
      }).then(r => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: runKeys.all }),
  });
}

export function useRunArtifacts(runId: string) {
  return useQuery({
    queryKey: ['runs', runId, 'artifacts'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<KernelArtifact[]>(ENDPOINTS.RUNS.ARTIFACTS(runId));
      return data;
    },
    enabled: !!runId,
  });
}

export function useRunStream(runId: string | null, onEvent?: (event: RunEvent) => void) {
  const qc = useQueryClient();
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleEvent = useCallback(
    (event: RunEvent) => {
      onEvent?.(event);
      if (
        event.event_type === 'RUN_COMPLETED' ||
        event.event_type === 'RUN_FAILED' ||
        event.event_type === 'RUN_CANCELED'
      ) {
        qc.invalidateQueries({ queryKey: runKeys.detail(event.run_id) });
        qc.invalidateQueries({ queryKey: runKeys.all });
      }
    },
    [onEvent, qc]
  );

  useEffect(() => {
    if (!runId) return;
    cleanupRef.current = createRunStream(runId, handleEvent);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [runId, handleEvent]);
}
