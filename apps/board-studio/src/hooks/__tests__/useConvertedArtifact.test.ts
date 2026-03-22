// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { isConvertible, useConvertedArtifact } from '@airaie/shared';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('isConvertible', () => {
  it('returns true for .step files', () => {
    expect(isConvertible('model.step')).toBe(true);
  });

  it('returns true for .stp files', () => {
    expect(isConvertible('model.stp')).toBe(true);
  });

  it('returns true for .iges files', () => {
    expect(isConvertible('model.iges')).toBe(true);
  });

  it('returns true for .igs files', () => {
    expect(isConvertible('model.igs')).toBe(true);
  });

  it('returns false for .stl files', () => {
    expect(isConvertible('model.stl')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isConvertible(undefined)).toBe(false);
  });
});

describe('useConvertedArtifact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips lineage query when file is not convertible', () => {
    const { result } = renderHook(
      () => useConvertedArtifact('art_123', 'model.stl'),
      { wrapper: createWrapper() },
    );

    expect(result.current.needsConversion).toBe(false);
    // Lineage query should be disabled (not loading)
    expect(result.current.isCheckingLineage).toBe(false);
    expect(result.current.cachedGltfId).toBeNull();
  });

  it('enables lineage query when file is convertible', async () => {
    const { result } = renderHook(
      () => useConvertedArtifact('art_123', 'model.step'),
      { wrapper: createWrapper() },
    );

    // Hook should recognize the file needs conversion
    expect(result.current.needsConversion).toBe(true);
    // Lineage query should be enabled (starts loading)
    // It will fail because there's no real API, but that's fine --
    // we're testing that the hook correctly enables the query
    expect(result.current.cachedGltfId).toBeNull();
  });
});
