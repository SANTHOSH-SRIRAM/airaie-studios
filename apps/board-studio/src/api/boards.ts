// ============================================================
// Board API functions — wraps axios calls with KERNEL_ENDPOINTS
// ============================================================

import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type {
  Board,
  BoardSummary,
  BoardTemplate,
  IntentType,
  BoardListParams,
} from '@/types/board';

// ------------------------------------------------------------
// Boards
// ------------------------------------------------------------

export async function fetchBoards(params?: BoardListParams): Promise<Board[]> {
  const { data } = await axios.get<{ boards: Board[] }>(KERNEL_ENDPOINTS.BOARDS.LIST, { params });
  return data.boards ?? [];
}

export async function fetchBoard(id: string): Promise<Board> {
  const { data } = await axios.get<Board>(KERNEL_ENDPOINTS.BOARDS.GET(id));
  return data;
}

export async function fetchBoardSummary(id: string): Promise<BoardSummary> {
  const { data } = await axios.get<BoardSummary>(KERNEL_ENDPOINTS.BOARDS.SUMMARY(id));
  return data;
}

export async function fetchBoardChildren(id: string): Promise<Board[]> {
  const { data } = await axios.get<{ boards: Board[] }>(KERNEL_ENDPOINTS.BOARDS.CHILDREN(id));
  return data.boards ?? [];
}

export async function createBoardFromIntent(payload: {
  mode: string;
  intent_type_id: string;
  intent_spec: Record<string, unknown>;
  name?: string;
  description?: string;
}): Promise<Board> {
  const { data } = await axios.post<Board>(KERNEL_ENDPOINTS.BOARDS.FROM_INTENT, payload);
  return data;
}

export async function createBoardFromTemplate(payload: {
  template_slug: string;
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>;
}): Promise<Board> {
  const { data } = await axios.post<Board>(KERNEL_ENDPOINTS.BOARDS.FROM_TEMPLATE, payload);
  return data;
}

export async function updateBoard(
  id: string,
  payload: Partial<Pick<Board, 'name' | 'description' | 'status'>>
): Promise<Board> {
  const { data } = await axios.patch<Board>(KERNEL_ENDPOINTS.BOARDS.UPDATE(id), payload);
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  await axios.delete(KERNEL_ENDPOINTS.BOARDS.DELETE(id));
}

export async function escalateBoard(id: string, targetMode: string): Promise<Board> {
  const { data } = await axios.post<Board>(KERNEL_ENDPOINTS.BOARDS.ESCALATE(id), {
    target_mode: targetMode,
  });
  return data;
}

// ------------------------------------------------------------
// Board Templates
// ------------------------------------------------------------

export async function fetchBoardTemplates(): Promise<BoardTemplate[]> {
  const { data } = await axios.get<{ templates: BoardTemplate[] }>(
    KERNEL_ENDPOINTS.BOARD_TEMPLATES.LIST
  );
  return data.templates ?? [];
}

export async function fetchBoardTemplate(slug: string): Promise<BoardTemplate> {
  const { data } = await axios.get<BoardTemplate>(KERNEL_ENDPOINTS.BOARD_TEMPLATES.GET(slug));
  return data;
}

// ------------------------------------------------------------
// Intent Types
// ------------------------------------------------------------

export async function fetchIntentTypes(verticalSlug: string): Promise<IntentType[]> {
  const { data } = await axios.get<{ intent_types: IntentType[] }>(
    KERNEL_ENDPOINTS.INTENT_TYPES.BY_VERTICAL(verticalSlug)
  );
  return data.intent_types ?? [];
}
