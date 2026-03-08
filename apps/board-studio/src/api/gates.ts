// ============================================================
// Gate API functions — wraps apiClient calls with KERNEL_ENDPOINTS
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { Gate, GateRequirement, BackendGate } from '@/types/board';

// --- Transformer ---

/** Transform backend gate (gate_type) to frontend Gate (type) + fetch requirements */
function transformGate(
  raw: BackendGate,
  requirements: GateRequirement[] = []
): Gate {
  return {
    id: raw.id,
    board_id: raw.board_id,
    name: raw.name,
    type: raw.gate_type as Gate['type'],
    status: raw.status as Gate['status'],
    requirements,
  };
}

// --- Queries ---

export async function fetchGates(boardId: string): Promise<Gate[]> {
  const { data } = await apiClient.get<{ gates: BackendGate[] }>(
    KERNEL_ENDPOINTS.GATES.LIST,
    { params: { board_id: boardId } }
  );

  const rawGates = data.gates ?? [];

  // Fetch requirements for each gate in parallel
  const gates = await Promise.all(
    rawGates.map(async (raw) => {
      const reqs = await fetchGateRequirements(raw.id).catch(() => []);
      return transformGate(raw, reqs);
    })
  );

  return gates;
}

export async function fetchGate(id: string): Promise<Gate> {
  const [gateRes, reqs] = await Promise.all([
    apiClient.get<BackendGate>(KERNEL_ENDPOINTS.GATES.GET(id)),
    fetchGateRequirements(id).catch(() => []),
  ]);
  return transformGate(gateRes.data, reqs);
}

interface BackendGateRequirement {
  id: string;
  gate_id: string;
  req_type: string;
  description: string;
  config?: string;
  satisfied: boolean;
  created_at?: string;
}

async function fetchGateRequirements(gateId: string): Promise<GateRequirement[]> {
  const { data } = await apiClient.get<{ requirements: BackendGateRequirement[] }>(
    KERNEL_ENDPOINTS.GATES.REQUIREMENTS(gateId)
  );
  return (data.requirements ?? []).map((r) => ({
    id: r.id,
    name: r.req_type,
    description: r.description,
    satisfied: r.satisfied,
  }));
}

// --- Mutations ---

export async function evaluateGate(id: string): Promise<Gate> {
  const { data } = await apiClient.post<BackendGate>(
    KERNEL_ENDPOINTS.GATES.EVALUATE(id)
  );
  return transformGate(data);
}

export async function approveGate(
  id: string,
  payload?: { role?: string }
): Promise<Gate> {
  const { data } = await apiClient.post<BackendGate>(
    KERNEL_ENDPOINTS.GATES.APPROVE(id),
    payload ?? {}
  );
  return transformGate(data);
}

export async function rejectGate(
  id: string,
  payload: { rationale: string }
): Promise<Gate> {
  const { data } = await apiClient.post<BackendGate>(
    KERNEL_ENDPOINTS.GATES.REJECT(id),
    payload
  );
  return transformGate(data);
}

export async function waiveGate(
  id: string,
  payload: { rationale: string }
): Promise<Gate> {
  const { data } = await apiClient.post<BackendGate>(
    KERNEL_ENDPOINTS.GATES.WAIVE(id),
    payload
  );
  return transformGate(data);
}
