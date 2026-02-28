// ============================================================
// TanStack Query hooks for plan CRUD and execution
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlan,
  generatePlan,
  compilePlan,
  validatePlan,
  executePlan,
  fetchPlanExecutionStatus,
  type PlanResponse,
  type PlanExecutionStatus,
} from '@api/plans';

// --- Query key factory ---

export const planKeys = {
  all: ['plans'] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (cardId: string) => [...planKeys.details(), cardId] as const,
  execution: (cardId: string) => [...planKeys.all, 'execution', cardId] as const,
};

// --- Queries ---

/**
 * Fetch the execution plan for a card.
 */
export function usePlan(cardId: string | undefined) {
  return useQuery<PlanResponse>({
    queryKey: planKeys.detail(cardId!),
    queryFn: () => fetchPlan(cardId!),
    enabled: !!cardId,
  });
}

/**
 * Poll execution status while plan is executing.
 * Uses TanStack Query refetchInterval (not raw setInterval).
 * Polls every 2s while executing, stops on completed/failed.
 */
export function usePlanExecutionStatus(
  cardId: string | undefined,
  enabled: boolean = false
) {
  return useQuery<PlanExecutionStatus>({
    queryKey: planKeys.execution(cardId!),
    queryFn: () => fetchPlanExecutionStatus(cardId!),
    enabled: !!cardId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      // Stop polling when execution is complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        return false;
      }
      return 2000;
    },
  });
}

// --- Mutations ---

/**
 * Generate a plan for a card (POST /v0/cards/:id/plan/generate).
 */
export function useGeneratePlan(cardId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => generatePlan(cardId!),
    onSuccess: () => {
      if (cardId) {
        qc.invalidateQueries({ queryKey: planKeys.detail(cardId) });
      }
    },
  });
}

/**
 * Compile a plan for a card (POST /v0/cards/:id/plan/compile).
 */
export function useCompilePlan(cardId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => compilePlan(cardId!),
    onSuccess: () => {
      if (cardId) {
        qc.invalidateQueries({ queryKey: planKeys.detail(cardId) });
      }
    },
  });
}

/**
 * Validate (preflight) a plan for a card (POST /v0/cards/:id/plan/validate).
 */
export function useValidatePlan(cardId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => validatePlan(cardId!),
    onSuccess: () => {
      if (cardId) {
        qc.invalidateQueries({ queryKey: planKeys.detail(cardId) });
      }
    },
  });
}

/**
 * Execute a validated plan (POST /v0/cards/:id/plan/execute).
 */
export function useExecutePlan(cardId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => executePlan(cardId!),
    onSuccess: () => {
      if (cardId) {
        qc.invalidateQueries({ queryKey: planKeys.detail(cardId) });
        qc.invalidateQueries({ queryKey: planKeys.execution(cardId) });
      }
    },
  });
}
