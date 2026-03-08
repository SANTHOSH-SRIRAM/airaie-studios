// ============================================================
// TanStack Query hooks for plan CRUD and execution
// ============================================================
//
// POLLING vs REAL-TIME STATUS (Sprint 7 Investigation — N-2)
// -----------------------------------------------------------
// Current approach: usePlanExecutionStatus uses TanStack Query's
// refetchInterval to poll the execution status endpoint every 2 seconds.
// Polling stops automatically when status reaches "completed" or "failed".
//
// Future upgrade path — WebSocket or SSE:
//   1. Kernel adds a WebSocket endpoint (e.g. ws://localhost:8000/v0/ws/cards/:id/execution)
//      or an SSE endpoint (GET /v0/cards/:id/execution/stream, Accept: text/event-stream).
//   2. Create a useExecutionStream(cardId) hook that opens the connection and
//      writes updates directly into the TanStack Query cache via queryClient.setQueryData.
//   3. Replace refetchInterval polling with the stream hook. Keep fetchPlanExecutionStatus
//      as a fallback for initial load and reconnect scenarios.
//   4. Benefits: sub-100ms latency (vs 2s), lower server load, accurate progress bars.
//   5. Consider shared WebSocket connection per board (multiplexed card updates)
//      to avoid one connection per executing card.
//
// The 2s polling is adequate for the current scale and will remain until the
// kernel backend exposes a streaming endpoint.
// -----------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlan,
  generatePlan,
  editPlan,
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
 * Returns null when the plan service is unavailable (503).
 */
export function usePlan(cardId: string | undefined) {
  return useQuery<PlanResponse | null>({
    queryKey: planKeys.detail(cardId!),
    queryFn: () => fetchPlan(cardId!),
    enabled: !!cardId,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
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
    retry: false,
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
 * Edit a plan for a card (PATCH /v0/cards/:id/plan).
 * Accepts a partial payload to update plan steps or metadata.
 */
export function useEditPlan(cardId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => editPlan(cardId!, payload),
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
