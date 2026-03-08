// ============================================================
// ToolShelf API functions — wraps apiClient calls for tool resolution
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ToolEntry } from '@/types/board';

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
