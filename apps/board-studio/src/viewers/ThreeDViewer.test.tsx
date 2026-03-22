import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => (
    <div data-testid="r3f-canvas" {...props}>
      {children}
    </div>
  ),
  useLoader: () => ({
    attributes: { position: { array: new Float32Array() } },
    computeVertexNormals: vi.fn(),
  }),
  useThree: () => ({
    gl: { dispose: vi.fn() },
    scene: {},
    camera: {},
  }),
}));

// Mock @react-three/drei
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Stage: ({ children }: any) => <>{children}</>,
  Center: ({ children }: any) => <>{children}</>,
  useGLTF: () => ({ scene: {} }),
  Environment: () => null,
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

// Mock ViewerToolbar
vi.mock('./shared/ViewerToolbar', () => ({
  ViewerToolbar: ({ filename, children }: { filename?: string; children?: React.ReactNode }) => (
    <div data-testid="viewer-toolbar">
      <span>{filename}</span>
      {children}
    </div>
  ),
}));

// Mock sub-components
vi.mock('./three/StlModel', () => ({
  StlModel: () => <div data-testid="stl-model" />,
}));

vi.mock('./three/GltfModel', () => ({
  GltfModel: () => <div data-testid="gltf-model" />,
}));

vi.mock('./three/SceneSetup', () => ({
  SceneSetup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scene-setup">{children}</div>
  ),
}));

import ThreeDViewer, { getModelFormat } from './ThreeDViewer';

describe('getModelFormat', () => {
  it('returns "stl" for .stl files', () => {
    expect(getModelFormat('model.stl')).toBe('stl');
  });

  it('returns "stl" for uppercase .STL files', () => {
    expect(getModelFormat('model.STL')).toBe('stl');
  });

  it('returns "gltf" for .gltf files', () => {
    expect(getModelFormat('scene.gltf')).toBe('gltf');
  });

  it('returns "glb" for .glb files', () => {
    expect(getModelFormat('scene.glb')).toBe('glb');
  });

  it('returns null for unsupported formats', () => {
    expect(getModelFormat('file.txt')).toBeNull();
  });

  it('returns null for undefined filename', () => {
    expect(getModelFormat(undefined)).toBeNull();
  });
});

describe('ThreeDViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Canvas with data-testid="r3f-canvas" for STL file', () => {
    render(<ThreeDViewer url="https://example.com/model.stl" filename="model.stl" />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('renders Canvas with data-testid="r3f-canvas" for GLTF file', () => {
    render(<ThreeDViewer url="https://example.com/scene.gltf" filename="scene.gltf" />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('renders ViewerError for unsupported format', () => {
    render(<ThreeDViewer url="https://example.com/file.txt" filename="file.txt" />);
    expect(screen.getByTestId('viewer-error')).toBeInTheDocument();
    expect(screen.getByText('Unsupported 3D format')).toBeInTheDocument();
  });

  it('renders ViewerToolbar with filename', () => {
    render(<ThreeDViewer url="https://example.com/model.stl" filename="model.stl" />);
    expect(screen.getByTestId('viewer-toolbar')).toBeInTheDocument();
    expect(screen.getByText('model.stl')).toBeInTheDocument();
  });

  it('shows size warning for files > 50MB', () => {
    render(
      <ThreeDViewer
        url="https://example.com/huge.stl"
        filename="huge.stl"
        sizeBytes={60_000_000}
      />
    );
    expect(screen.getByTestId('viewer-error')).toBeInTheDocument();
    expect(screen.getByText(/too large/i)).toBeInTheDocument();
  });
});
