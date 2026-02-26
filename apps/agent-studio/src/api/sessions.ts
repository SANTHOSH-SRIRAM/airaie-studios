import { apiClient, ENDPOINTS } from '@airaie/shared';
import type { KernelSession } from '@airaie/shared';

export async function listSessions(agentId: string) {
  const { data } = await apiClient.get<KernelSession[]>(ENDPOINTS.AGENTS.SESSIONS(agentId));
  return data;
}

export async function createSession(agentId: string, body?: { context?: Record<string, unknown> }) {
  const { data } = await apiClient.post<KernelSession>(ENDPOINTS.AGENTS.SESSIONS(agentId), body);
  return data;
}

export async function getSession(agentId: string, sessionId: string) {
  const { data } = await apiClient.get<KernelSession>(ENDPOINTS.AGENTS.SESSION(agentId, sessionId));
  return data;
}

export async function runInSession(agentId: string, sessionId: string, body: { inputs: Record<string, unknown> }) {
  const { data } = await apiClient.post(ENDPOINTS.AGENTS.SESSION_RUN(agentId, sessionId), body);
  return data;
}

export async function closeSession(agentId: string, sessionId: string) {
  const { data } = await apiClient.post(ENDPOINTS.AGENTS.SESSION_CLOSE(agentId, sessionId));
  return data;
}

export async function sendMessage(agentId: string, sessionId: string, body: { content: string }) {
  const { data } = await apiClient.post(ENDPOINTS.AGENTS.SESSION_MESSAGES(agentId, sessionId), body);
  return data;
}

export async function approveAction(agentId: string, sessionId: string, body: { action_id: string; decision: 'approve' | 'reject' }) {
  const { data } = await apiClient.post(ENDPOINTS.AGENTS.SESSION_APPROVE(agentId, sessionId), body);
  return data;
}
