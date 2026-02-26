import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/agents';

const KEYS = {
  all: ['agents'] as const,
  detail: (id: string) => ['agents', id] as const,
  versions: (id: string) => ['agents', id, 'versions'] as const,
  version: (id: string, v: number) => ['agents', id, 'versions', v] as const,
};

export function useAgents() {
  return useQuery({ queryKey: KEYS.all, queryFn: api.listAgents });
}

export function useAgent(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => api.getAgent(id), enabled: !!id });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useAgentVersions(agentId: string) {
  return useQuery({
    queryKey: KEYS.versions(agentId),
    queryFn: () => api.listVersions(agentId),
    enabled: !!agentId,
  });
}

export function useAgentVersion(agentId: string, version: number) {
  return useQuery({
    queryKey: KEYS.version(agentId, version),
    queryFn: () => api.getVersion(agentId, version),
    enabled: !!agentId && version > 0,
  });
}

export function useCreateAgentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, spec }: { agentId: string; spec: Record<string, unknown> }) =>
      api.createVersion(agentId, { spec }),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.versions(agentId) }),
  });
}

export function useValidateAgentVersion() {
  return useMutation({
    mutationFn: ({ agentId, version }: { agentId: string; version: number }) =>
      api.validateVersion(agentId, version),
  });
}

export function usePublishAgentVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, version }: { agentId: string; version: number }) =>
      api.publishVersion(agentId, version),
    onSuccess: (_, { agentId }) => qc.invalidateQueries({ queryKey: KEYS.versions(agentId) }),
  });
}
