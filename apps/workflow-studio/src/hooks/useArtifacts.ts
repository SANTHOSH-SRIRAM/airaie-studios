import { useQuery } from '@tanstack/react-query';
import * as api from '@api/artifacts';

const KEYS = {
  all: ['artifacts'] as const,
  detail: (id: string) => ['artifacts', id] as const,
  lineage: (id: string) => ['artifacts', id, 'lineage'] as const,
};

export function useArtifacts(params?: { type?: string; limit?: number; offset?: number }) {
  return useQuery({ queryKey: [...KEYS.all, params], queryFn: () => api.listArtifacts(params) });
}

export function useArtifact(id: string) {
  return useQuery({ queryKey: KEYS.detail(id), queryFn: () => api.getArtifact(id), enabled: !!id });
}

export function useArtifactLineage(id: string) {
  return useQuery({
    queryKey: KEYS.lineage(id),
    queryFn: () => api.getLineage(id),
    enabled: !!id,
  });
}
