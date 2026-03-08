// ============================================================
// TanStack Query hooks for runs & decision traces
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchRuns, fetchRun, fetchDecisionTraces } from '@api/runs';
import type { RunListParams } from '@api/runs';
import type { Run, DecisionTrace } from '@/types/execution';

// --- Query key factories ---

export const runKeys = {
  all: ['runs'] as const,
  list: (params?: RunListParams) => [...runKeys.all, 'list', params] as const,
  detail: (id: string) => [...runKeys.all, 'detail', id] as const,
  traces: (runId: string) => [...runKeys.all, 'traces', runId] as const,
};

// --- Queries ---

export function useRuns(params?: RunListParams, enabled = true) {
  return useQuery<Run[]>({
    queryKey: runKeys.list(params),
    queryFn: () => fetchRuns(params),
    enabled,
    staleTime: 15_000,
  });
}

export function useRunDetail(runId: string | undefined) {
  return useQuery<Run>({
    queryKey: runKeys.detail(runId!),
    queryFn: () => fetchRun(runId!),
    enabled: !!runId,
  });
}

export function useDecisionTraces(runId: string | undefined) {
  return useQuery<DecisionTrace[]>({
    queryKey: runKeys.traces(runId!),
    queryFn: () => fetchDecisionTraces(runId!),
    enabled: !!runId,
    staleTime: 30_000,
  });
}
