import { describe, it, expect } from 'vitest';
import {
  kernelArtifactToRunArtifact,
  matchArtifacts,
  getArtifactPreviewType,
} from '../artifactHelpers';
import type { KernelArtifact } from '../../types/kernel';

// ─── Helper factory ──────────────────────────────────────────

function makeKernelArtifact(overrides: Partial<KernelArtifact> = {}): KernelArtifact {
  return {
    id: 'art_001',
    project_id: 'proj_001',
    name: 'stress_contour',
    type: 'image',
    content_hash: 'sha256:abc123',
    size_bytes: 245760,
    storage_uri: 's3://bucket/stress_contour.png',
    created_by: 'user_001',
    created_at: '2026-03-20T12:00:00Z',
    ...overrides,
  };
}

// ─── kernelArtifactToRunArtifact ─────────────────────────────

describe('kernelArtifactToRunArtifact', () => {
  it('maps name to key with empty url (D-01: on-demand)', () => {
    const ka = makeKernelArtifact({
      name: 'stress_contour',
      type: 'image',
      size_bytes: 245760,
    });
    const result = kernelArtifactToRunArtifact(ka);
    expect(result.key).toBe('stress_contour');
    expect(result.url).toBe('');
    expect(result.filename).toBe('stress_contour');
    expect(result.size_bytes).toBe(245760);
    expect(result.content_type).toBe('image');
  });

  it('uses metadata.content_type when available (overrides type)', () => {
    const ka = makeKernelArtifact({
      type: 'document',
      metadata: { content_type: 'application/pdf' },
    });
    const result = kernelArtifactToRunArtifact(ka);
    expect(result.content_type).toBe('application/pdf');
  });

  it('falls back to artifact.type when metadata has no content_type', () => {
    const ka = makeKernelArtifact({ type: 'image', metadata: {} });
    const result = kernelArtifactToRunArtifact(ka);
    expect(result.content_type).toBe('image');
  });

  it('falls back to artifact.type when metadata is undefined', () => {
    const ka = makeKernelArtifact({ type: 'text/csv', metadata: undefined });
    const result = kernelArtifactToRunArtifact(ka);
    expect(result.content_type).toBe('text/csv');
  });
});

// ─── matchArtifacts ──────────────────────────────────────────

describe('matchArtifacts', () => {
  const defs = [
    { key: 'stress_contour', type: 'png', label: 'Stress Contour', preview: 'image' as const, downloadable: true },
    { key: 'report', type: 'pdf', label: 'Analysis Report', preview: 'document' as const, downloadable: true },
  ];

  it('matches artifacts by name to outputSchema keys, unmatched go to fallback (D-10, D-11)', () => {
    const artifacts: KernelArtifact[] = [
      makeKernelArtifact({ name: 'stress_contour', id: 'a1' }),
      makeKernelArtifact({ name: 'report', id: 'a2', type: 'document' }),
      makeKernelArtifact({ name: 'extra_log', id: 'a3', type: 'text' }),
    ];

    const result = matchArtifacts(artifacts, defs);
    expect(result.matched.size).toBe(2);
    expect(result.matched.get('stress_contour')?.key).toBe('stress_contour');
    expect(result.matched.get('report')?.key).toBe('report');
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0].key).toBe('extra_log');
  });

  it('returns empty matched and unmatched for empty artifacts array', () => {
    const result = matchArtifacts([], defs);
    expect(result.matched.size).toBe(0);
    expect(result.unmatched).toHaveLength(0);
  });

  it('handles duplicate names by keeping the latest by created_at', () => {
    const artifacts: KernelArtifact[] = [
      makeKernelArtifact({ name: 'stress_contour', id: 'old', created_at: '2026-03-19T12:00:00Z' }),
      makeKernelArtifact({ name: 'stress_contour', id: 'new', created_at: '2026-03-20T12:00:00Z' }),
    ];

    const result = matchArtifacts(artifacts, defs);
    expect(result.matched.size).toBe(1);
    // The matched artifact should come from the newer one
    const matched = result.matched.get('stress_contour');
    expect(matched).toBeDefined();
    // Unmatched should be empty (duplicate is deduplicated, not added to unmatched)
    expect(result.unmatched).toHaveLength(0);
  });

  it('handles empty defs — all artifacts are unmatched', () => {
    const artifacts: KernelArtifact[] = [
      makeKernelArtifact({ name: 'stress_contour', id: 'a1' }),
    ];
    const result = matchArtifacts(artifacts, []);
    expect(result.matched.size).toBe(0);
    expect(result.unmatched).toHaveLength(1);
  });
});

// ─── getArtifactPreviewType ──────────────────────────────────

describe('getArtifactPreviewType', () => {
  it('maps image/* to "image"', () => {
    expect(getArtifactPreviewType('image/png')).toBe('image');
    expect(getArtifactPreviewType('image/jpeg')).toBe('image');
    expect(getArtifactPreviewType('image/svg+xml')).toBe('image');
  });

  it('maps application/pdf to "document"', () => {
    expect(getArtifactPreviewType('application/pdf')).toBe('document');
  });

  it('maps text/csv to "table"', () => {
    expect(getArtifactPreviewType('text/csv')).toBe('table');
  });

  it('maps text/tab-separated-values to "table"', () => {
    expect(getArtifactPreviewType('text/tab-separated-values')).toBe('table');
  });

  it('maps model/* to "3d"', () => {
    expect(getArtifactPreviewType('model/gltf+json')).toBe('3d');
    expect(getArtifactPreviewType('model/stl')).toBe('3d');
  });

  it('maps unknown types to "download"', () => {
    expect(getArtifactPreviewType('application/zip')).toBe('download');
    expect(getArtifactPreviewType('application/octet-stream')).toBe('download');
    expect(getArtifactPreviewType('')).toBe('download');
  });
});
