// ============================================================
// ToolShelf API functions — wraps apiClient calls for tool resolution
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ToolEntry } from '@/types/board';

// --- V2 Resolve types (backend response shape) ---

export interface ToolShelfEntry {
  tool_id: string;
  tool_version: string;
  name: string;
  trust_level: 'certified' | 'verified' | 'experimental';
  cost_estimate: number;
  time_estimate: string;
  match_reasons: string[];
  success_rate: number;      // 0.0-1.0
  confidence: number;        // 0.0-1.0
  score: number;
}

export interface PipelineShelfEntry {
  pipeline_id: string;
  slug: string;
  name: string;
  step_count: number;
  trust_level: string;
  cost_estimate: number;
  time_estimate: string;
  steps: { order: number; tool_id: string; tool_version: string; role: string }[];
  match_reasons: string[];
  score: number;
}

export interface UnavailableEntry {
  tool_id: string;
  name: string;
  reason: string;
  action: string;
  filter_stage: string;
}

export interface UnavailablePipelineEntry {
  pipeline_id: string;
  name: string;
  reason: string;
  action: string;
  filter_stage: string;
}

export interface ResolveResultV2 {
  recommended_pipelines: PipelineShelfEntry[];
  recommended_tools: ToolShelfEntry[];
  unavailable_pipelines: UnavailablePipelineEntry[];
  unavailable_tools: UnavailableEntry[];
  resolved_at: string;
  intent_type: string;
}

/**
 * Resolve tools for a given card type / intent type via POST.
 * Backend expects `intent_type` field (not `intent_spec`).
 */
export async function resolveTools(
  intentType: string,
  config?: Record<string, unknown>
): Promise<ToolEntry[]> {
  const { data } = await apiClient.post<{ tools: ToolEntry[] }>(
    KERNEL_ENDPOINTS.TOOLSHELF.RESOLVE,
    { intent_type: intentType, config: config ?? {} }
  );
  return data.tools ?? [];
}

export interface ToolDetail {
  id: string;
  name: string;
  type: 'tool' | 'pipeline';
  description: string;
  version: string;
  trust_level: string;
  supported_intents: string[];
  parameters: Record<string, unknown>;
}

export async function fetchToolDetail(id: string): Promise<ToolDetail> {
  const { data } = await apiClient.get<ToolDetail>(
    KERNEL_ENDPOINTS.TOOLSHELF.TOOL_DETAIL(id)
  );
  return data;
}

// --- V2 Resolve function ---

/**
 * Resolve tools and pipelines for a given intent type via POST /v0/toolshelf/resolve/v2.
 * Returns grouped recommendations with match reasons, scores, and unavailable entries.
 */
export async function resolveToolShelf(
  intentType: string,
  projectId: string,
): Promise<ResolveResultV2> {
  const { data } = await apiClient.post<ResolveResultV2>(
    KERNEL_ENDPOINTS.TOOLSHELF.RESOLVE,
    { intent_type: intentType, project_id: projectId },
  );
  return data;
}
