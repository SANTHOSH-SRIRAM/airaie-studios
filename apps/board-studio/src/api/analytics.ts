// ============================================================
// Analytics API — aggregated stats for dashboard
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Run } from '@/types/execution';

export interface AnalyticsSummary {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  running_runs: number;
  pending_approvals: number;
  total_boards: number;
  avg_reproducibility: number | null;
}

/**
 * Build analytics summary from existing endpoints.
 * Calls runs + boards + gates in parallel to aggregate dashboard stats.
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [runsRes, boardsRes] = await Promise.allSettled([
    apiClient.get<{ runs: Run[] }>(KERNEL_ENDPOINTS.RUNS.LIST, {
      params: { limit: 200 },
    }),
    apiClient.get<{ boards: { id: string }[] }>(KERNEL_ENDPOINTS.BOARDS.LIST, {
      params: { limit: 200 },
    }),
  ]);

  const runs =
    runsRes.status === 'fulfilled' ? runsRes.value.data.runs ?? [] : [];
  const boards =
    boardsRes.status === 'fulfilled' ? boardsRes.value.data.boards ?? [] : [];

  // Aggregate gates pending across all boards (max 10 boards to avoid N+1)
  let pendingApprovals = 0;
  const boardsToCheck = boards.slice(0, 10);
  const gateResults = await Promise.allSettled(
    boardsToCheck.map((b) =>
      apiClient.get<{ gates: { status: string }[] }>(
        KERNEL_ENDPOINTS.GATES.LIST,
        { params: { board_id: b.id } }
      )
    )
  );
  for (const r of gateResults) {
    if (r.status === 'fulfilled') {
      pendingApprovals += (r.value.data.gates ?? []).filter(
        (g) => g.status === 'PENDING'
      ).length;
    }
  }

  return {
    total_runs: runs.length,
    completed_runs: runs.filter((r) => r.status === 'completed' || r.status === 'SUCCEEDED').length,
    failed_runs: runs.filter((r) => r.status === 'failed' || r.status === 'FAILED').length,
    running_runs: runs.filter((r) => r.status === 'running' || r.status === 'RUNNING').length,
    pending_approvals: pendingApprovals,
    total_boards: boards.length,
    avg_reproducibility: null, // Computed client-side if needed
  };
}
