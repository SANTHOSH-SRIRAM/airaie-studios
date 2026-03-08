import { apiClient, ENDPOINTS } from '@airaie/shared';

export interface Trigger {
  id: string;
  workflow_id: string;
  project_id: string;
  type: 'cron' | 'webhook' | 'event';
  config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function listTriggers(workflowId: string) {
  const { data } = await apiClient.get<Trigger[]>(ENDPOINTS.TRIGGERS.LIST(workflowId));
  return data;
}

export async function getTrigger(workflowId: string, triggerId: string) {
  const { data } = await apiClient.get<{ trigger: Trigger }>(ENDPOINTS.TRIGGERS.GET(workflowId, triggerId));
  return data.trigger;
}

export async function createTrigger(workflowId: string, body: {
  type: string;
  config: Record<string, unknown>;
  enabled: boolean;
}) {
  const { data } = await apiClient.post<{ trigger: Trigger }>(ENDPOINTS.TRIGGERS.CREATE(workflowId), body);
  return data.trigger;
}

export async function updateTrigger(workflowId: string, triggerId: string, body: {
  type?: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}) {
  const { data } = await apiClient.patch<{ trigger: Trigger }>(ENDPOINTS.TRIGGERS.UPDATE(workflowId, triggerId), body);
  return data.trigger;
}

export async function deleteTrigger(workflowId: string, triggerId: string) {
  await apiClient.delete(ENDPOINTS.TRIGGERS.DELETE(workflowId, triggerId));
}
