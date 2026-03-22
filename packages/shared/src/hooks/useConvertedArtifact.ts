import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLineage, convertArtifact } from '../api/artifacts';

const CONVERTIBLE_EXTENSIONS = ['step', 'stp', 'iges', 'igs'];

/**
 * Returns true if the given filename has a STEP or IGES extension
 * that can be converted to GLTF for 3D viewing.
 */
export function isConvertible(filename?: string): boolean {
  if (!filename) return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return CONVERTIBLE_EXTENSIONS.includes(ext ?? '');
}

/**
 * Hook for managing STEP/IGES to GLTF conversion flow.
 * Checks lineage for cached conversions, triggers new conversion if needed.
 */
export function useConvertedArtifact(artifactId: string, filename?: string) {
  const queryClient = useQueryClient();
  const needsConversion = isConvertible(filename);

  // Check lineage for existing GLTF conversion (cache hit via artifact lineage)
  const lineageQuery = useQuery({
    queryKey: ['artifacts', artifactId, 'lineage'] as const,
    queryFn: () => getLineage(artifactId),
    enabled: needsConversion && !!artifactId,
    select: (lineage) => {
      // Find a child artifact with step_to_gltf or iges_to_gltf transform
      const converted = lineage.find(
        (edge) => edge.transform === 'step_to_gltf' || edge.transform === 'iges_to_gltf',
      );
      return converted?.output_artifact ?? null;
    },
  });

  // Trigger conversion if no cached GLTF found
  const convertMutation = useMutation({
    mutationFn: () => convertArtifact(artifactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artifacts', artifactId, 'lineage'] });
    },
  });

  return {
    needsConversion,
    cachedGltfId: lineageQuery.data ?? null,
    isCheckingLineage: lineageQuery.isLoading,
    lineageError: lineageQuery.error,
    convertMutation,
  };
}
