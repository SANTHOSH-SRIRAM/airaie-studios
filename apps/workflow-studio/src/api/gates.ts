import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelGate, KernelGateRequirement, KernelGateApproval } from '@airaie/shared';

export async function listGates(params?: { status?: string; limit?: number }) {
  const { data } = await apiClient.get<KernelGate[]>(ENDPOINTS.GATES.LIST, { params });
  return data;
}

export async function getGate(id: string) {
  const { data } = await apiClient.get<KernelGate>(ENDPOINTS.GATES.GET(id));
  return data;
}

export async function createGate(body: { board_id: string; name: string; gate_type: string }) {
  const { data } = await apiClient.post<KernelGate>(ENDPOINTS.GATES.CREATE, body);
  return data;
}

export async function listRequirements(gateId: string) {
  const { data } = await apiClient.get<KernelGateRequirement[]>(ENDPOINTS.GATES.REQUIREMENTS(gateId));
  return data;
}

export async function addRequirement(gateId: string, body: { req_type: string; description: string; config: Record<string, unknown> }) {
  const { data } = await apiClient.post<KernelGateRequirement>(ENDPOINTS.GATES.REQUIREMENTS(gateId), body);
  return data;
}

export async function evaluateGate(id: string) {
  const { data } = await apiClient.post(ENDPOINTS.GATES.EVALUATE(id));
  return data;
}

export async function approveGate(id: string, body: { rationale?: string }) {
  const { data } = await apiClient.post(ENDPOINTS.GATES.APPROVE(id), body);
  return data;
}

export async function rejectGate(id: string, body: { rationale?: string }) {
  const { data } = await apiClient.post(ENDPOINTS.GATES.REJECT(id), body);
  return data;
}

export async function waiveGate(id: string, body: { rationale?: string }) {
  const { data } = await apiClient.post(ENDPOINTS.GATES.WAIVE(id), body);
  return data;
}

export async function listApprovals(gateId: string) {
  const { data } = await apiClient.get<KernelGateApproval[]>(ENDPOINTS.GATES.APPROVALS(gateId));
  return data;
}
