// ============================================================
// Execution API functions — toolshelf + evidence (typed)
//
// Plan operations live in plans.ts — re-exported here for
// a unified execution entry point.
// ============================================================

import apiClient from './client';
import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type {
  ToolRecommendation,
  CardEvidence,
  PreflightResult,
} from '@/types/execution';

// Re-export plan operations for unified access
export {
  fetchPlan,
  generatePlan,
  editPlan,
  compilePlan,
  validatePlan,
  executePlan,
  fetchPlanExecutionStatus,
} from './plans';

// --- Tool Recommendations ---

export async function fetchToolRecommendations(
  intentType: string,
  constraints?: Record<string, unknown>
): Promise<ToolRecommendation[]> {
  try {
    const { data } = await apiClient.post<{ tools: ToolRecommendation[] }>(
      KERNEL_ENDPOINTS.TOOLSHELF.RESOLVE,
      { intent_type: intentType, constraints }
    );
    return data.tools ?? [];
  } catch {
    // Graceful fallback — toolshelf may not be configured
    return [];
  }
}

// --- Evidence (typed with execution.ts CardEvidence) ---

export async function fetchCardEvidence(
  cardId: string,
  filters?: { run_id?: string; latest?: boolean }
): Promise<CardEvidence[]> {
  try {
    const { data } = await apiClient.get<{ evidence: CardEvidence[] }>(
      KERNEL_ENDPOINTS.CARDS.EVIDENCE(cardId),
      { params: filters }
    );
    return data.evidence ?? [];
  } catch {
    return [];
  }
}

// --- Preflight (standalone validate returning typed PreflightResult) ---

export async function runPreflight(cardId: string): Promise<PreflightResult> {
  const { data } = await apiClient.post<{ preflight: PreflightResult }>(
    KERNEL_ENDPOINTS.PLANS.VALIDATE(cardId)
  );
  return data.preflight;
}
