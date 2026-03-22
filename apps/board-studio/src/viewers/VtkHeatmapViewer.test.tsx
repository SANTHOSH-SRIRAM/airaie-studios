import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import React from 'react';

// Polyfill ResizeObserver for jsdom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_cb: ResizeObserverCallback) {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// --- Mocks ---

const mockLoadFile = vi.fn().mockResolvedValue(undefined);
const mockSetColorMap = vi.fn();
const mockSetScalarRange = vi.fn();
const mockDispose = vi.fn();
const mockResize = vi.fn();
const mockContainer = document.createElement('div');
mockContainer.setAttribute('data-testid', 'vtk-container');

class MockVtkJsSimulationViewer {
  loadFile = mockLoadFile;
  setColorMap = mockSetColorMap;
  setScalarRange = mockSetScalarRange;
  getContainer = () => mockContainer;
  dispose = mockDispose;
  resize = mockResize;
}

vi.mock('./vtk/VtkJsSimulationViewer', () => ({
  VtkJsSimulationViewer: MockVtkJsSimulationViewer,
}));

vi.mock('./vtk/format-utils', () => ({
  isVtkFile: vi.fn().mockReturnValue(true),
}));

vi.mock('./shared/ViewerError', () => ({
  ViewerError: ({ message, filename }: { message: string; filename?: string }) => (
    <div data-testid="viewer-error">
      <span>{message}</span>
      {filename && <span>{filename}</span>}
    </div>
  ),
}));

vi.mock('./shared/ViewerToolbar', () => ({
  ViewerToolbar: ({ filename, children }: { filename?: string; children?: React.ReactNode }) => (
    <div data-testid="viewer-toolbar">
      <span>{filename}</span>
      {children}
    </div>
  ),
}));

import { isVtkFile } from './vtk/format-utils';
import VtkHeatmapViewer from './VtkHeatmapViewer';

describe('VtkHeatmapViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isVtkFile as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockLoadFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders ViewerError when filename is not a VTK file', () => {
    (isVtkFile as ReturnType<typeof vi.fn>).mockReturnValue(false);
    render(<VtkHeatmapViewer url="https://example.com/file.txt" filename="file.txt" />);
    expect(screen.getByTestId('viewer-error')).toBeInTheDocument();
    expect(screen.getByText(/Unsupported simulation format/)).toBeInTheDocument();
  });

  it('renders loading state initially while vtk.js loads', () => {
    // loadFile will not resolve immediately
    mockLoadFile.mockReturnValue(new Promise(() => {}));
    render(<VtkHeatmapViewer url="https://example.com/result.vtp" filename="result.vtp" />);
    // Should show some loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders container div and toolbar when loaded', async () => {
    render(<VtkHeatmapViewer url="https://example.com/result.vtp" filename="result.vtp" />);
    await waitFor(() => {
      expect(screen.getByTestId('viewer-toolbar')).toBeInTheDocument();
    });
  });

  it('renders color map dropdown with 5 presets', async () => {
    render(<VtkHeatmapViewer url="https://example.com/result.vtp" filename="result.vtp" />);
    await waitFor(() => {
      expect(screen.getByTestId('viewer-toolbar')).toBeInTheDocument();
    });
    const select = screen.getByRole('combobox', { name: /color map/i });
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(5);
  });

  it('renders scalar range min/max inputs', async () => {
    render(<VtkHeatmapViewer url="https://example.com/result.vtp" filename="result.vtp" />);
    await waitFor(() => {
      expect(screen.getByTestId('viewer-toolbar')).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/min/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max/i)).toBeInTheDocument();
  });

  it('calls dispose on unmount', async () => {
    const { unmount } = render(
      <VtkHeatmapViewer url="https://example.com/result.vtp" filename="result.vtp" />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('viewer-toolbar')).toBeInTheDocument();
    });
    unmount();
    expect(mockDispose).toHaveBeenCalled();
  });

  it('renders ViewerError on load failure', async () => {
    mockLoadFile.mockRejectedValue(new Error('Network error'));
    render(<VtkHeatmapViewer url="https://example.com/bad.vtp" filename="bad.vtp" />);
    await waitFor(() => {
      expect(screen.getByTestId('viewer-error')).toBeInTheDocument();
    });
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });
});
