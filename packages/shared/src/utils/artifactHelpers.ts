import type { KernelArtifact } from '../types/kernel';

// ─── Types ───────────────────────────────────────────────────

/** Artifact preview type — how to render the artifact */
export type ArtifactPreviewType = 'image' | '3d' | 'document' | 'table' | 'code' | 'download';

/** A single output artifact definition from the vertical registry */
export interface OutputArtifactDefinition {
  key: string;
  type: string;
  label: string;
  preview: ArtifactPreviewType;
  downloadable: boolean;
  description?: string;
}

/** Frontend-friendly artifact representation */
export interface RunArtifact {
  key: string;
  url: string;
  filename?: string;
  size_bytes?: number;
  content_type?: string;
}

// ─── Transform ───────────────────────────────────────────────

/**
 * Convert a KernelArtifact to a RunArtifact.
 * URL is empty (D-01: presigned URLs fetched on-demand, not on card open).
 */
export function kernelArtifactToRunArtifact(artifact: KernelArtifact): RunArtifact {
  return {
    key: artifact.name,
    url: '',
    filename: artifact.name,
    size_bytes: artifact.size_bytes,
    content_type:
      (artifact.metadata?.content_type as string | undefined) ?? artifact.type,
  };
}

// ─── Matching ────────────────────────────────────────────────

/**
 * Match kernel artifacts against outputSchema definitions by name (D-10).
 * Unmatched artifacts are returned in a separate array (D-11).
 * For duplicate names, keeps the latest by created_at.
 */
export function matchArtifacts(
  kernelArtifacts: KernelArtifact[],
  artifactDefs: OutputArtifactDefinition[]
): { matched: Map<string, RunArtifact>; unmatched: RunArtifact[] } {
  const defKeys = new Set(artifactDefs.map((d) => d.key));
  const matched = new Map<string, RunArtifact>();
  const unmatched: RunArtifact[] = [];

  // Deduplicate by name — keep latest created_at
  const deduped = new Map<string, KernelArtifact>();
  for (const artifact of kernelArtifacts) {
    const existing = deduped.get(artifact.name);
    if (!existing || artifact.created_at > existing.created_at) {
      deduped.set(artifact.name, artifact);
    }
  }

  for (const artifact of deduped.values()) {
    const runArtifact = kernelArtifactToRunArtifact(artifact);
    if (defKeys.has(artifact.name)) {
      matched.set(artifact.name, runArtifact);
    } else {
      unmatched.push(runArtifact);
    }
  }

  return { matched, unmatched };
}

// ─── Preview type detection ──────────────────────────────────

/**
 * Determine the best preview type based on content_type.
 */
export function getArtifactPreviewType(contentType: string): ArtifactPreviewType {
  if (!contentType) return 'download';

  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'document';
  if (contentType === 'text/csv' || contentType === 'text/tab-separated-values') return 'table';
  if (contentType.startsWith('model/')) return '3d';

  return 'download';
}
