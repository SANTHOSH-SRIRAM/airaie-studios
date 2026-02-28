// ============================================================
// Gate API functions — wraps axios calls with KERNEL_ENDPOINTS
// ============================================================

import axios from 'axios';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Gate } from '@/types/board';

// --- Queries ---

export async function fetchGates(boardId: string): Promise<Gate[]> {
  const { data } = await axios.get<{ gates: Gate[] }>(
    KERNEL_ENDPOINTS.GATES.LIST(boardId)
  );
  return data.gates ?? [];
}

export async function fetchGate(id: string): Promise<Gate> {
  const { data } = await axios.get<Gate>(KERNEL_ENDPOINTS.GATES.GET(id));
  return data;
}

// --- Mutations ---

export async function approveGate(
  id: string,
  payload?: { comment?: string }
): Promise<Gate> {
  const { data } = await axios.post<Gate>(
    KERNEL_ENDPOINTS.GATES.APPROVE(id),
    payload ?? {}
  );
  return data;
}

export async function rejectGate(
  id: string,
  payload: { reason: string }
): Promise<Gate> {
  const { data } = await axios.post<Gate>(
    KERNEL_ENDPOINTS.GATES.REJECT(id),
    payload
  );
  return data;
}

export async function waiveGate(
  id: string,
  payload?: { reason?: string }
): Promise<Gate> {
  const { data } = await axios.post<Gate>(
    KERNEL_ENDPOINTS.GATES.WAIVE(id),
    payload ?? {}
  );
  return data;
}
