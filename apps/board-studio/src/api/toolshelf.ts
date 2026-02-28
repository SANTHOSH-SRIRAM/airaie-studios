// ============================================================
// ToolShelf API functions — wraps axios calls for tool resolution
// ============================================================

import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ToolEntry } from '@/types/board';

/**
 * Resolve tools for a given intent spec via POST.
 * IMPORTANT: Uses POST /v0/toolshelf/resolve/v2, NOT GET by card ID.
 */
export async function resolveTools(
  intentSpec: Record<string, unknown>
): Promise<ToolEntry[]> {
  const { data } = await axios.post<{ tools: ToolEntry[] }>(
    KERNEL_ENDPOINTS.TOOLSHELF.RESOLVE,
    { intent_spec: intentSpec }
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
  const { data } = await axios.get<ToolDetail>(
    KERNEL_ENDPOINTS.TOOLSHELF.TOOL_DETAIL(id)
  );
  return data;
}
