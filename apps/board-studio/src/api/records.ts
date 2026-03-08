// ============================================================
// Board Records & Attachments API
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { BoardRecord, BoardAttachment, RecordType } from '@/types/board';

// --- Records ---

export async function fetchRecords(boardId: string): Promise<BoardRecord[]> {
  const { data } = await apiClient.get<{ records: BoardRecord[] }>(
    KERNEL_ENDPOINTS.BOARDS.RECORDS(boardId)
  );
  return data.records ?? [];
}

export async function createRecord(
  boardId: string,
  payload: { type: RecordType; content: string; metadata?: Record<string, unknown> }
): Promise<BoardRecord> {
  const { data } = await apiClient.post<BoardRecord>(
    KERNEL_ENDPOINTS.BOARDS.RECORDS(boardId),
    payload
  );
  return data;
}

export async function deleteRecord(boardId: string, recordId: string): Promise<void> {
  await apiClient.delete(`${KERNEL_ENDPOINTS.BOARDS.RECORDS(boardId)}/${recordId}`);
}

// --- Attachments ---

export async function fetchAttachments(boardId: string): Promise<BoardAttachment[]> {
  const { data } = await apiClient.get<{ attachments: BoardAttachment[] }>(
    KERNEL_ENDPOINTS.BOARDS.ATTACHMENTS(boardId)
  );
  return data.attachments ?? [];
}
