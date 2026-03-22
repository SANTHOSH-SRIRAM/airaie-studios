// ============================================================
// Artifact API — lineage and provenance queries
// ============================================================

import apiClient from '@api/client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type { ArtifactLineageNode, ArtifactLineageEdge } from '@/types/analytics';

export interface ArtifactLineageData {
  nodes: ArtifactLineageNode[];
  edges: ArtifactLineageEdge[];
}

/**
 * Fetch artifact lineage DAG for a given artifact.
 * GET /v0/artifacts/{id}/lineage
 * Response shape: { lineage: { nodes: [...], edges: [...] } }
 */
export async function fetchArtifactLineage(artifactId: string): Promise<ArtifactLineageData> {
  const res = await apiClient.get(KERNEL_ENDPOINTS.ARTIFACTS.LINEAGE(artifactId));
  const lineage = (res as any)?.lineage;
  return {
    nodes: lineage?.nodes ?? [],
    edges: lineage?.edges ?? [],
  };
}
