// ============================================================
// Viewer Registry — plugin-style registry for artifact viewers
// Phases 3-7 call registerViewer() to replace stubs with real
// implementations without modifying this source file.
// ============================================================

import React, { Suspense } from 'react';
import { Skeleton } from '@airaie/ui';
import type { ArtifactPreviewType } from '@/types/vertical-registry';
import type { ViewerProps, LazyViewer } from '@/types/viewer';
import { Download } from 'lucide-react';

// ─── Internal registry ──────────────────────────────────────

const registry = new Map<ArtifactPreviewType, LazyViewer>();

// ─── Public API ──────────────────────────────────────────────

export function registerViewer(
  type: ArtifactPreviewType,
  loader: () => Promise<{ default: React.ComponentType<ViewerProps> }>,
): void {
  registry.set(type, React.lazy(loader));
}

export function getViewer(type: ArtifactPreviewType): LazyViewer | null {
  return registry.get(type) ?? null;
}

export function hasViewer(type: ArtifactPreviewType): boolean {
  return registry.has(type);
}

/** Test-only: reset registry state between tests */
export function _resetRegistryForTesting(): void {
  registry.clear();
}

// ─── Skeleton sizing per viewer type ─────────────────────────

const skeletonConfig: Record<ArtifactPreviewType, string> = {
  image: 'h-64 w-full',
  '3d': 'h-80 w-full',
  heatmap: 'h-80 w-full',
  document: 'h-96 w-full',
  table: 'h-48 w-full',
  code: 'h-40 w-full',
  download: 'h-16 w-full',
};

// ─── Format file size ────────────────────────────────────────

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Download fallback (D-09) ────────────────────────────────

function DownloadFallback({ url, filename, sizeBytes, onDownload }: ViewerProps) {
  const formattedSize = formatBytes(sizeBytes);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return React.createElement(
    'div',
    {
      className:
        'flex items-center gap-3 px-4 py-3 bg-slate-50 border border-surface-border rounded',
    },
    React.createElement(Download, { size: 20, className: 'text-content-muted shrink-0' }),
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement(
        'div',
        { className: 'text-sm font-medium text-content-primary truncate' },
        filename ?? 'Unknown file',
      ),
      formattedSize
        ? React.createElement(
            'div',
            { className: 'text-xs text-content-muted' },
            formattedSize,
          )
        : null,
    ),
    React.createElement(
      'button',
      {
        onClick: handleDownload,
        className:
          'px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors',
        'aria-label': 'Download',
      },
      'Download',
    ),
  );
}

// ─── ArtifactPreviewRouter ───────────────────────────────────

export interface ArtifactPreviewRouterProps extends ViewerProps {
  type: ArtifactPreviewType;
}

export function ArtifactPreviewRouter({ type, ...viewerProps }: ArtifactPreviewRouterProps) {
  const Viewer = getViewer(type);

  if (!Viewer) {
    return React.createElement(DownloadFallback, viewerProps);
  }

  return React.createElement(
    Suspense,
    {
      fallback: React.createElement(Skeleton, {
        className: skeletonConfig[type] ?? skeletonConfig.download,
      }),
    },
    React.createElement(Viewer, viewerProps),
  );
}
