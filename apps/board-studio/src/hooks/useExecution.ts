// ============================================================
// TanStack Query hooks for execution lifecycle
//
// Plan hooks live in usePlan.ts — re-exported here for
// a unified execution entry point.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchToolRecommendations,
  fetchCardEvidence,
  runPreflight,
} from '@api/execution';
import type { ToolRecommendation, CardEvidence, PreflightResult } from '@/types/execution';

// Re-export plan hooks for unified access
export {
  usePlan as useExecutionPlan,
  usePlanExecutionStatus as usePlanProgress,
  useGeneratePlan,
  useEditPlan,
  useCompilePlan,
  useValidatePlan,
  useExecutePlan,
  planKeys,
} from './usePlan';

// --- Query key factories ---

export const executionKeys = {
  toolRecommendations: (intentType: string) =>
    ['tool-recommendations', intentType] as const,
  evidence: (cardId: string, filters?: Record<string, unknown>) =>
    ['card-evidence', cardId, filters] as const,
};

// --- Tool Recommendations ---

export function useToolRecommendations(
  intentType: string | undefined,
  constraints?: Record<string, unknown>
) {
  return useQuery<ToolRecommendation[]>({
    queryKey: executionKeys.toolRecommendations(intentType!),
    queryFn: () => fetchToolRecommendations(intentType!, constraints),
    enabled: !!intentType,
    staleTime: 60_000, // Cache 1 minute
  });
}

// --- Evidence ---

export function useCardEvidence(
  cardId: string | undefined,
  filters?: { run_id?: string; latest?: boolean }
) {
  return useQuery<CardEvidence[]>({
    queryKey: executionKeys.evidence(cardId!, filters),
    queryFn: () => fetchCardEvidence(cardId!, filters),
    enabled: !!cardId,
    staleTime: 10_000,
  });
}

export function useCardEvidencePolling(
  cardId: string | undefined,
  enabled: boolean
) {
  return useQuery<CardEvidence[]>({
    queryKey: executionKeys.evidence(cardId!, { latest: true }),
    queryFn: () => fetchCardEvidence(cardId!, { latest: true }),
    enabled: !!cardId && enabled,
    refetchInterval: 3_000, // Poll every 3s while gathering evidence
    staleTime: 2_000,
  });
}

// --- Preflight (standalone mutation) ---

export function useRunPreflight() {
  const qc = useQueryClient();
  return useMutation<PreflightResult, Error, string>({
    mutationFn: (cardId: string) => runPreflight(cardId),
    onSuccess: (_, cardId) => {
      qc.invalidateQueries({ queryKey: ['plans', 'detail', cardId] });
    },
  });
}
