// ============================================================
// useHeroArtifact — Auto-select hero artifact from outputSchema order
// D-01: First matched artifact with a registered viewer becomes hero
// ============================================================

import { useState, useMemo } from 'react';
import type { IntentCardConfig, OutputArtifactDefinition, ArtifactPreviewType } from '@/types/vertical-registry';
import type { KernelArtifact } from '@airaie/shared';
import { matchArtifacts, kernelArtifactToRunArtifact } from '@airaie/shared';
import type { RunArtifact } from '@airaie/shared';
import { hasViewer } from '@/registry/viewer-registry';

/** Hero artifact with its matching definition (if any) */
export interface HeroArtifactResult {
  artifact: RunArtifact;
  definition: OutputArtifactDefinition | null;
}

/** Fallback type priority when no outputSchema available */
const TYPE_PRIORITY: ArtifactPreviewType[] = ['image', 'table', 'document', 'code', 'download'];

/**
 * Infer preview type from content_type string.
 */
function inferPreviewType(contentType?: string): ArtifactPreviewType {
  if (!contentType) return 'download';
  if (contentType.startsWith('image/')) return 'image';
  if (contentType === 'application/pdf') return 'document';
  if (contentType === 'text/csv' || contentType === 'text/tab-separated-values') return 'table';
  if (contentType.startsWith('model/')) return '3d';
  if (contentType.startsWith('text/')) return 'code';
  return 'download';
}

export function useHeroArtifact(
  intentConfig: IntentCardConfig | null | undefined,
  kernelArtifacts: KernelArtifact[] | undefined,
) {
  const [overrideKey, setOverrideKey] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!kernelArtifacts || kernelArtifacts.length === 0) {
      return { heroArtifact: null, otherArtifacts: [] as HeroArtifactResult[] };
    }

    const outputSchema = intentConfig?.outputSchema;
    const artifactDefs = outputSchema?.artifacts ?? [];

    // Match kernel artifacts against outputSchema definitions
    const { matched, unmatched } = matchArtifacts(kernelArtifacts, artifactDefs);

    // Build ordered list of all artifacts with definitions
    const allArtifacts: HeroArtifactResult[] = [];

    // First: matched artifacts in outputSchema order
    for (const def of artifactDefs) {
      const artifact = matched.get(def.key);
      if (artifact) {
        allArtifacts.push({ artifact, definition: def });
      }
    }

    // Then: unmatched artifacts
    for (const artifact of unmatched) {
      allArtifacts.push({ artifact, definition: null });
    }

    if (allArtifacts.length === 0) {
      return { heroArtifact: null, otherArtifacts: [] as HeroArtifactResult[] };
    }

    // If user manually selected a hero key, use it
    if (overrideKey) {
      const overrideIdx = allArtifacts.findIndex((a) => a.artifact.key === overrideKey);
      if (overrideIdx >= 0) {
        const hero = allArtifacts[overrideIdx];
        const others = allArtifacts.filter((_, i) => i !== overrideIdx);
        return { heroArtifact: hero, otherArtifacts: others };
      }
    }

    // Auto-select hero: first artifact with a registered viewer
    if (artifactDefs.length > 0) {
      // Use outputSchema order — first matched artifact with a viewer
      for (let i = 0; i < allArtifacts.length; i++) {
        const entry = allArtifacts[i];
        const previewType = entry.definition?.preview ?? inferPreviewType(entry.artifact.content_type);
        if (hasViewer(previewType)) {
          const others = allArtifacts.filter((_, j) => j !== i);
          return { heroArtifact: entry, otherArtifacts: others };
        }
      }
    } else {
      // Fallback: no outputSchema, use type priority
      for (const priorityType of TYPE_PRIORITY) {
        const idx = allArtifacts.findIndex((a) => {
          const preview = inferPreviewType(a.artifact.content_type);
          return preview === priorityType;
        });
        if (idx >= 0) {
          const hero = allArtifacts[idx];
          const others = allArtifacts.filter((_, j) => j !== idx);
          return { heroArtifact: hero, otherArtifacts: others };
        }
      }
    }

    // Ultimate fallback: first artifact
    const [hero, ...others] = allArtifacts;
    return { heroArtifact: hero, otherArtifacts: others };
  }, [intentConfig, kernelArtifacts, overrideKey]);

  return {
    heroArtifact: result.heroArtifact,
    otherArtifacts: result.otherArtifacts,
    setHeroKey: setOverrideKey,
  };
}
