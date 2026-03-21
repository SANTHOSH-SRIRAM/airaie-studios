import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { ENDPOINTS } from '../constants/api';
import { getDownloadURL } from '../api/artifacts';
import type { KernelArtifact } from '../types/kernel';

export function useRunArtifacts(runId: string) {
  return useQuery({
    queryKey: ['runs', runId, 'artifacts'] as const,
    queryFn: async () => {
      const { data } = await apiClient.get<KernelArtifact[]>(ENDPOINTS.RUNS.ARTIFACTS(runId));
      return data;
    },
    enabled: !!runId,
    staleTime: 30_000,
  });
}

export function useArtifactDownloadUrl() {
  return useMutation({
    mutationFn: async (artifactId: string) => {
      const result = await getDownloadURL(artifactId);
      return result;
    },
  });
}
