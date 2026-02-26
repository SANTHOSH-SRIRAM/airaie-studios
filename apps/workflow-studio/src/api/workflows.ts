import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelWorkflow, KernelWorkflowVersion } from '@airaie/shared';

export async function listWorkflows() {
  const { data } = await apiClient.get<KernelWorkflow[]>(ENDPOINTS.WORKFLOWS.LIST);
  return data;
}

export async function getWorkflow(id: string) {
  const { data } = await apiClient.get<KernelWorkflow>(ENDPOINTS.WORKFLOWS.GET(id));
  return data;
}

export async function createWorkflow(body: { name: string; description?: string }) {
  const { data } = await apiClient.post<KernelWorkflow>(ENDPOINTS.WORKFLOWS.CREATE, body);
  return data;
}

export async function deleteWorkflow(id: string) {
  await apiClient.delete(ENDPOINTS.WORKFLOWS.DELETE(id));
}

export async function listVersions(workflowId: string) {
  const { data } = await apiClient.get<KernelWorkflowVersion[]>(ENDPOINTS.WORKFLOWS.VERSIONS(workflowId));
  return data;
}

export async function getVersion(workflowId: string, version: number) {
  const { data } = await apiClient.get<KernelWorkflowVersion>(ENDPOINTS.WORKFLOWS.VERSION(workflowId, version));
  return data;
}

export async function createVersion(workflowId: string, body: { dsl: Record<string, unknown> }) {
  const { data } = await apiClient.post<KernelWorkflowVersion>(ENDPOINTS.WORKFLOWS.VERSIONS(workflowId), body);
  return data;
}

export async function publishVersion(workflowId: string, version: number) {
  const { data } = await apiClient.post(ENDPOINTS.WORKFLOWS.PUBLISH(workflowId, version));
  return data;
}

export async function compileWorkflow(body: { dsl: Record<string, unknown> }) {
  const { data } = await apiClient.post(ENDPOINTS.WORKFLOWS.COMPILE, body);
  return data;
}

export async function validateWorkflow(body: { dsl: Record<string, unknown> }) {
  const { data } = await apiClient.post(ENDPOINTS.WORKFLOWS.VALIDATE, body);
  return data;
}

export async function planWorkflow(body: { dsl: Record<string, unknown> }) {
  const { data } = await apiClient.post(ENDPOINTS.WORKFLOWS.PLAN, body);
  return data;
}
