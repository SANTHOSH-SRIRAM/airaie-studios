import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelApprovalRequest } from '@airaie/shared';

export async function listApprovals(params?: { status?: string; limit?: number; offset?: number }) {
  const { data } = await apiClient.get<KernelApprovalRequest[]>(ENDPOINTS.APPROVALS.LIST, { params });
  return data;
}

export async function getApproval(id: string) {
  const { data } = await apiClient.get<KernelApprovalRequest>(ENDPOINTS.APPROVALS.GET(id));
  return data;
}

export async function approveRequest(id: string, body: { comment?: string }) {
  const { data } = await apiClient.post<KernelApprovalRequest>(ENDPOINTS.APPROVALS.APPROVE(id), body);
  return data;
}

export async function rejectRequest(id: string, body: { reason: string }) {
  const { data } = await apiClient.post<KernelApprovalRequest>(ENDPOINTS.APPROVALS.REJECT(id), body);
  return data;
}
