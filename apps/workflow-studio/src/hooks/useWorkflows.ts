import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@api/workflows';

const KEYS = {
  all: ['workflows'] as const,
  detail: (id: string) => ['workflows', id] as const,
  versions: (id: string) => ['workflows', id, 'versions'] as const,
  version: (id: string, v: number) => ['workflows', id, 'versions', v] as const,
};

export function useWorkflows() {
  return useQuery({ queryKey: KEYS.all, queryFn: api.listWorkflows });
}

export function useWorkflow(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => api.getWorkflow(id), enabled: !!id });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteWorkflow,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useWorkflowVersions(workflowId: string) {
  return useQuery({
    queryKey: KEYS.versions(workflowId),
    queryFn: () => api.listVersions(workflowId),
    enabled: !!workflowId,
  });
}

export function useWorkflowVersion(workflowId: string, version: number) {
  return useQuery({
    queryKey: KEYS.version(workflowId, version),
    queryFn: () => api.getVersion(workflowId, version),
    enabled: !!workflowId && version > 0,
  });
}

export function useCreateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, dsl }: { workflowId: string; dsl: Record<string, unknown> }) =>
      api.createVersion(workflowId, { dsl }),
    onSuccess: (_, { workflowId }) => qc.invalidateQueries({ queryKey: KEYS.versions(workflowId) }),
  });
}

export function usePublishVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workflowId, version }: { workflowId: string; version: number }) =>
      api.publishVersion(workflowId, version),
    onSuccess: (_, { workflowId }) => qc.invalidateQueries({ queryKey: KEYS.versions(workflowId) }),
  });
}

export function useCompileWorkflow() {
  return useMutation({ mutationFn: api.compileWorkflow });
}

export function useValidateWorkflow() {
  return useMutation({ mutationFn: api.validateWorkflow });
}
