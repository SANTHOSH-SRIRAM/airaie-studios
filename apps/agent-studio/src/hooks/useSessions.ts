import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/sessions';

const KEYS = {
  all: (agentId: string) => ['sessions', agentId] as const,
  session: (agentId: string, sid: string) => ['sessions', agentId, sid] as const,
};

export function useSessions(agentId: string) {
  return useQuery({
    queryKey: KEYS.all(agentId),
    queryFn: () => api.listSessions(agentId),
    enabled: !!agentId,
  });
}

export function useSession(agentId: string, sessionId: string) {
  return useQuery({
    queryKey: KEYS.session(agentId, sessionId),
    queryFn: () => api.getSession(agentId, sessionId),
    enabled: !!agentId && !!sessionId,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, context }: { agentId: string; context?: Record<string, unknown> }) =>
      api.createSession(agentId, context ? { context } : undefined),
    onSuccess: (_, { agentId }) =>
      qc.invalidateQueries({ queryKey: KEYS.all(agentId) }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, sessionId, content }: { agentId: string; sessionId: string; content: string }) =>
      api.sendMessage(agentId, sessionId, { content }),
    onSuccess: (_, { agentId, sessionId }) =>
      qc.invalidateQueries({ queryKey: KEYS.session(agentId, sessionId) }),
  });
}

/**
 * Run the agent within a session — returns a KernelRun with an ID
 * that can be streamed via useRunStream(). Use this for execution-mode
 * interactions (non-dry-run) where you need live progress updates.
 */
export function useRunInSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, sessionId, inputs }: { agentId: string; sessionId: string; inputs: Record<string, unknown> }) =>
      api.runInSession(agentId, sessionId, { inputs }),
    onSuccess: (_, { agentId, sessionId }) =>
      qc.invalidateQueries({ queryKey: KEYS.session(agentId, sessionId) }),
  });
}

export function useCloseSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, sessionId }: { agentId: string; sessionId: string }) =>
      api.closeSession(agentId, sessionId),
    onSuccess: (_, { agentId, sessionId }) =>
      qc.invalidateQueries({ queryKey: KEYS.session(agentId, sessionId) }),
  });
}

export function useApproveAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      sessionId,
      actionId,
      decision,
    }: {
      agentId: string;
      sessionId: string;
      actionId: string;
      decision: 'approve' | 'reject';
    }) => api.approveAction(agentId, sessionId, { action_id: actionId, decision }),
    onSuccess: (_, { agentId, sessionId }) =>
      qc.invalidateQueries({ queryKey: KEYS.session(agentId, sessionId) }),
  });
}
