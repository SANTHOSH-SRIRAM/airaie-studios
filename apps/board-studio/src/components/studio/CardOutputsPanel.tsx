// ============================================================
// CardOutputsPanel — post-execution artifact viewer
// Schema-driven from outputSchema in the vertical registry
// ============================================================

import React, { useState, useCallback } from 'react';
import { Download, Image, FileText, Table2, Code, Box, ExternalLink, AlertCircle } from 'lucide-react';
import { Badge, Spinner, Skeleton } from '@airaie/ui';
import { useArtifactDownloadUrl } from '@airaie/shared';
import type { OutputArtifactDefinition, ArtifactPreviewType } from '@/types/vertical-registry';
import { ArtifactPreviewRouter } from '@/registry/viewer-registry';

export interface RunArtifact {
  key: string;
  url: string;
  filename?: string;
  size_bytes?: number;
  content_type?: string;
}

export interface CardOutputsPanelProps {
  artifactDefs: OutputArtifactDefinition[];
  artifacts: RunArtifact[];
  runId?: string;
  isLoading?: boolean;
  error?: unknown;
  artifactIdMap?: Map<string, string>;
}

// ─── Preview icon by type ────────────────────────────────────

const previewIcons: Record<ArtifactPreviewType, React.ElementType> = {
  image: Image,
  '3d': Box,
  document: FileText,
  table: Table2,
  code: Code,
  download: Download,
};

// ─── Format file size ────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Artifact row ────────────────────────────────────────────

function ArtifactRow({
  def,
  artifact,
  artifactIdMap,
}: {
  def: OutputArtifactDefinition;
  artifact?: RunArtifact;
  artifactIdMap?: Map<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const downloadUrlMut = useArtifactDownloadUrl();
  const PreviewIcon = previewIcons[def.preview] ?? Download;
  const available = !!artifact;

  // Effective artifact with fetched URL merged in
  const effectiveArtifact: RunArtifact | undefined = artifact
    ? { ...artifact, url: fetchedUrl ?? artifact.url }
    : undefined;

  const fetchUrl = useCallback(async () => {
    if (!artifact || !artifactIdMap) return;
    const artifactId = artifactIdMap.get(artifact.key);
    if (!artifactId) return;

    setUrlError(null);
    try {
      const result = await downloadUrlMut.mutateAsync(artifactId);
      setFetchedUrl(result.download_url);
      return result.download_url;
    } catch {
      setUrlError('Failed to load preview');
      return null;
    }
  }, [artifact, artifactIdMap, downloadUrlMut]);

  const handleClick = useCallback(async () => {
    if (!available) return;
    if (def.preview === 'download') return;

    // If URL not yet fetched, fetch it first
    if (!effectiveArtifact?.url) {
      await fetchUrl();
    }
    setExpanded(!expanded);
  }, [available, def.preview, effectiveArtifact?.url, fetchUrl, expanded]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!artifact) return;

    // If URL already available, let the browser handle it
    if (effectiveArtifact?.url) {
      window.open(effectiveArtifact.url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Fetch URL on-demand then open
    const url = await fetchUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [artifact, effectiveArtifact?.url, fetchUrl]);

  return (
    <div className={`border border-surface-border ${available ? '' : 'opacity-50'}`}>
      <div
        className={`flex items-center gap-2 px-3 py-2 ${available ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
        onClick={handleClick}
      >
        <PreviewIcon size={14} className={available ? 'text-blue-500' : 'text-content-muted'} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-content-primary truncate">{def.label}</div>
          {artifact && (
            <div className="text-[10px] text-content-muted">
              {artifact.filename ?? `${def.key}.${def.type}`}
              {artifact.size_bytes ? ` · ${formatBytes(artifact.size_bytes)}` : ''}
            </div>
          )}
          {!artifact && (
            <div className="text-[10px] text-content-muted">
              {`${def.key}.${def.type}`}
            </div>
          )}
        </div>
        <Badge variant={available ? 'success' : 'neutral'} className="text-[8px] shrink-0">
          {available ? def.type.toUpperCase() : 'pending'}
        </Badge>
        {available && def.downloadable && (
          <button
            onClick={handleDownload}
            className="p-1 text-content-muted hover:text-blue-500 transition-colors"
            title="Download"
          >
            {downloadUrlMut.isPending ? <Spinner size="sm" /> : <Download size={12} />}
          </button>
        )}
      </div>

      {urlError && (
        <div className="px-3 pb-2 flex items-center gap-1 text-[10px] text-red-600">
          <AlertCircle size={10} /> {urlError}
        </div>
      )}

      {expanded && effectiveArtifact && (
        <div className="px-3 pb-2">
          <ArtifactPreviewRouter
            type={def.preview}
            url={effectiveArtifact.url ?? ''}
            filename={effectiveArtifact.filename}
            contentType={effectiveArtifact.content_type}
            sizeBytes={effectiveArtifact.size_bytes}
            onDownload={() => handleDownload({} as React.MouseEvent)}
          />
          <div className="flex items-center gap-2 mt-2">
            {effectiveArtifact.url ? (
              <a
                href={effectiveArtifact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
              >
                <ExternalLink size={10} /> Open in new tab
              </a>
            ) : (
              <span className="text-[10px] text-content-muted italic">Loading URL...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

const CardOutputsPanel: React.FC<CardOutputsPanelProps> = ({
  artifactDefs,
  artifacts,
  runId,
  isLoading,
  error,
  artifactIdMap,
}) => {
  // Build a lookup from artifact key to actual artifact
  const artifactMap = new Map(artifacts.map((a) => [a.key, a]));

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 px-3 text-xs text-red-600">
        <AlertCircle size={14} />
        <span>Failed to load artifacts. Please try again.</span>
      </div>
    );
  }

  if (artifactDefs.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-content-muted">
        No output artifacts defined for this intent type.
      </div>
    );
  }

  const availableCount = artifactDefs.filter((d) => artifactMap.has(d.key)).length;

  // Collect unmatched artifacts (not in any def)
  const defKeySet = new Set(artifactDefs.map((d) => d.key));
  const unmatchedArtifacts = artifacts.filter((a) => !defKeySet.has(a.key));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-content-muted">
          {availableCount}/{artifactDefs.length} artifacts available
        </span>
        {runId && (
          <Badge variant="neutral" className="text-[8px]">
            Run: {runId.slice(0, 8)}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {artifactDefs.map((def) => (
          <ArtifactRow
            key={def.key}
            def={def}
            artifact={artifactMap.get(def.key)}
            artifactIdMap={artifactIdMap}
          />
        ))}
      </div>

      {/* Unmatched artifacts — download-only fallback (D-11) */}
      {unmatchedArtifacts.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-surface-border">
          <span className="text-[10px] text-content-muted">Additional outputs</span>
          {unmatchedArtifacts.map((artifact) => (
            <ArtifactRow
              key={artifact.key}
              def={{
                key: artifact.key,
                type: artifact.content_type ?? 'file',
                label: artifact.filename ?? artifact.key,
                preview: 'download',
                downloadable: true,
              }}
              artifact={artifact}
              artifactIdMap={artifactIdMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};

CardOutputsPanel.displayName = 'CardOutputsPanel';

export default CardOutputsPanel;
