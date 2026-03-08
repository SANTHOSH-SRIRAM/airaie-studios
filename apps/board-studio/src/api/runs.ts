// ============================================================
// Runs & Decision Traces API
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Run, DecisionTrace, RunType } from '@/types/execution';

// --- Runs ---

export interface RunListParams {
  card_id?: string;
  board_id?: string;
  run_type?: RunType;
  status?: string;
  offset?: number;
  limit?: number;
}

export async function fetchRuns(params?: RunListParams): Promise<Run[]> {
  try {
    const { data } = await apiClient.get<{ runs: Run[] }>(
      KERNEL_ENDPOINTS.RUNS.LIST,
      { params }
    );
    return data.runs ?? [];
  } catch {
    return [];
  }
}

export async function fetchRun(id: string): Promise<Run> {
  const { data } = await apiClient.get<Run>(KERNEL_ENDPOINTS.RUNS.GET(id));
  return data;
}

// --- Decision Traces ---

export async function fetchDecisionTraces(
  runId: string
): Promise<DecisionTrace[]> {
  try {
    const { data } = await apiClient.get<{ traces: DecisionTrace[] }>(
      KERNEL_ENDPOINTS.RUNS.TRACES(runId)
    );
    return data.traces ?? [];
  } catch {
    return [];
  }
}
