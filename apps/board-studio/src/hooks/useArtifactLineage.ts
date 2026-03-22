// ============================================================
// useArtifactLineage — React Query hook for artifact lineage DAG
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchArtifactLineage, type ArtifactLineageData } from '@api/artifacts';

/**
 * Fetches artifact lineage for a given artifact ID.
 * Lineage is immutable so staleTime is set to 5 minutes.
 */
export function useArtifactLineage(artifactId: string | undefined) {
  return useQuery<ArtifactLineageData>({
    queryKey: ['artifact-lineage', artifactId],
    queryFn: () => fetchArtifactLineage(artifactId!),
    enabled: !!artifactId,
    staleTime: 5 * 60 * 1000, // 5 minutes — lineage is immutable
  });
}
