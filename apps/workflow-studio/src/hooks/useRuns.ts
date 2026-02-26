import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { createRunStream } from '@airaie/shared';
import type { RunEvent } from '@airaie/shared';
import * as api from '@api/runs';

const KEYS = {
  all: ['runs'] as const,
  detail: (id: string) => ['runs', id] as const,
  logs: (id: string) => ['runs', id, 'logs'] as const,
  artifacts: (id: string) => ['runs', id, 'artifacts'] as const,
};

export function useRuns(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({ queryKey: [...KEYS.all, params], queryFn: () => api.listRuns(params) });
}

export function useRun(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => api.getRun(id), enabled: !!id });
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startRun,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.cancelRun,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useRunLogs(runId: string) {
  return useQuery({
    queryKey: KEYS.logs(runId),
    queryFn: () => api.getRunLogs(runId),
    enabled: !!runId,
  });
}

export function useRunArtifacts(runId: string) {
  return useQuery({
    queryKey: KEYS.artifacts(runId),
    queryFn: () => api.getRunArtifacts(runId),
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
        qc.invalidateQueries({ queryKey: KEYS.detail(event.run_id) });
        qc.invalidateQueries({ queryKey: KEYS.all });
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
