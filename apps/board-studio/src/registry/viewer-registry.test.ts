import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Module under test -- will be created in GREEN phase
import {
  registerViewer,
  getViewer,
  hasViewer,
  ArtifactPreviewRouter,
  _resetRegistryForTesting,
} from './viewer-registry';
import type { ViewerProps } from '@/types/viewer';

// Simple test viewer component
const TestViewer: React.FC<ViewerProps> = ({ filename }) =>
  React.createElement('div', { 'data-testid': 'test-viewer' }, `Viewing: ${filename}`);

describe('viewer-registry', () => {
  beforeEach(() => {
    // Reset registry between tests
    _resetRegistryForTesting();
  });

  describe('registerViewer', () => {
    it('stores a lazy component for a given ArtifactPreviewType key', () => {
      registerViewer('image', () => Promise.resolve({ default: TestViewer }));
      expect(hasViewer('image')).toBe(true);
    });

    it('overwrites previous registration for the same type', () => {
      const AltViewer: React.FC<ViewerProps> = () =>
        React.createElement('div', null, 'Alt');

      registerViewer('image', () => Promise.resolve({ default: TestViewer }));
      registerViewer('image', () => Promise.resolve({ default: AltViewer }));

      // Should still be registered (overwritten, not duplicated)
      expect(hasViewer('image')).toBe(true);

      // The second registration should be the active one
      const viewer = getViewer('image');
      expect(viewer).not.toBeNull();
    });
  });

  describe('getViewer', () => {
    it('returns the registered lazy component for a known type', () => {
      registerViewer('image', () => Promise.resolve({ default: TestViewer }));
      const viewer = getViewer('image');
      expect(viewer).not.toBeNull();
    });

    it('returns null for an unregistered type', () => {
      const viewer = getViewer('3d');
      expect(viewer).toBeNull();
    });
  });

  describe('hasViewer', () => {
    it('returns true for registered types', () => {
      registerViewer('table', () => Promise.resolve({ default: TestViewer }));
      expect(hasViewer('table')).toBe(true);
    });

    it('returns false for unregistered types', () => {
      expect(hasViewer('code')).toBe(false);
    });
  });

  describe('ArtifactPreviewRouter', () => {
    it('renders fallback DownloadFallback when type is not registered', () => {
      render(
        React.createElement(ArtifactPreviewRouter, {
          type: 'document',
          url: 'https://example.com/report.pdf',
          filename: 'report.pdf',
          sizeBytes: 2048,
        }),
      );

      // Should show filename
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
      // Should show a Download button
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    it('renders the registered viewer component when type is registered', async () => {
      // Register a synchronous-resolving lazy viewer
      registerViewer('image', () => Promise.resolve({ default: TestViewer }));

      render(
        React.createElement(ArtifactPreviewRouter, {
          type: 'image',
          url: 'https://example.com/pic.png',
          filename: 'pic.png',
        }),
      );

      // Wait for Suspense to resolve the lazy component
      const viewer = await screen.findByTestId('test-viewer');
      expect(viewer).toHaveTextContent('Viewing: pic.png');
    });

    it('shows formatted size in fallback', () => {
      render(
        React.createElement(ArtifactPreviewRouter, {
          type: 'code',
          url: 'https://example.com/log.txt',
          filename: 'log.txt',
          sizeBytes: 1536,
        }),
      );

      // 1536 bytes = 1.5 KB
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });
  });
});
