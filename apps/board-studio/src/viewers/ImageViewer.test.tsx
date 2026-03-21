import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock react-zoom-pan-pinch
const mockZoomIn = vi.fn();
const mockZoomOut = vi.fn();
const mockResetTransform = vi.fn();

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: (utils: any) => React.ReactNode }) => (
    <div data-testid="transform-wrapper">
      {typeof children === 'function' ? children({}) : children}
    </div>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="transform-component">{children}</div>
  ),
  useControls: () => ({
    zoomIn: mockZoomIn,
    zoomOut: mockZoomOut,
    resetTransform: mockResetTransform,
  }),
}));

// Mock @airaie/ui Skeleton
vi.mock('@airaie/ui', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// Mock ViewerError
vi.mock('./shared/ViewerError', () => ({
  ViewerError: ({ message, filename }: { message: string; filename?: string }) => (
    <div data-testid="viewer-error">
      <span>{message}</span>
      {filename && <span>{filename}</span>}
    </div>
  ),
}));

import ImageViewer from './ImageViewer';

describe('ImageViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an img element with the provided url as src', () => {
    render(<ImageViewer url="https://example.com/image.png" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.png');
  });

  it('shows Skeleton while image is loading', () => {
    render(<ImageViewer url="https://example.com/image.png" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('shows ViewerError when image fails to load', () => {
    render(<ImageViewer url="https://example.com/bad.png" filename="bad.png" />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(screen.getByTestId('viewer-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });

  it('renders zoom in, zoom out, and reset zoom buttons with correct aria-labels', () => {
    render(<ImageViewer url="https://example.com/image.png" />);
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('renders with filename as alt text when provided', () => {
    render(<ImageViewer url="https://example.com/image.png" filename="test-image.png" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'test-image.png');
  });

  it('renders with "Image preview" as alt text when filename not provided', () => {
    render(<ImageViewer url="https://example.com/image.png" />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Image preview');
  });
});
