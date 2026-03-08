import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as runsApi from '../api/runs';
import type { RunListParams } from '../api/runs';

export const runKeys = {
  all: ['runs'] as const,
  list: (params?: RunListParams) => ['runs', params] as const,
  detail: (id: string) => ['runs', id] as const,
  logs: (id: string) => ['runs', id, 'logs'] as const,
};

export function useRuns(params?: RunListParams) {
  return useQuery({
    queryKey: runKeys.list(params),
    queryFn: () => runsApi.listRuns(params),
  });
}

export function useRun(id: string) {
  return useQuery({
    queryKey: runKeys.detail(id),
    queryFn: () => runsApi.getRun(id),
    enabled: !!id,
  });
}

export function useRunLogs(id: string) {
  return useQuery({
    queryKey: runKeys.logs(id),
    queryFn: () => runsApi.getRunLogs(id),
    enabled: !!id,
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runsApi.cancelRun(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: runKeys.all });
      qc.invalidateQueries({ queryKey: runKeys.detail(id) });
    },
  });
}
