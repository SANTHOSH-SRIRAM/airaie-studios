import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ViewerError } from './shared/ViewerError';
import { ViewerToolbar } from './shared/ViewerToolbar';
import { SceneSetup } from './three/SceneSetup';
import { StlModel } from './three/StlModel';
import { GltfModel } from './three/GltfModel';
import type { ViewerProps } from '@/types/viewer';

type ModelFormat = 'stl' | 'gltf' | 'glb';

const MAX_SIZE_BYTES = 52_428_800; // 50MB

export function getModelFormat(filename: string | undefined): ModelFormat | null {
  if (!filename) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'stl') return 'stl';
  if (ext === 'gltf') return 'gltf';
  if (ext === 'glb') return 'glb';
  return null;
}

const ThreeDViewer: React.FC<ViewerProps> = ({ url, filename, sizeBytes, onDownload }) => {
  const format = getModelFormat(filename);

  if (!format) {
    return <ViewerError message="Unsupported 3D format" filename={filename} />;
  }

  if (sizeBytes && sizeBytes > MAX_SIZE_BYTES) {
    return (
      <div className="flex flex-col h-full">
        <ViewerError
          message="Model too large for browser preview (max 50MB)"
          filename={filename}
        />
        {onDownload && (
          <div className="flex justify-center pb-4">
            <button
              onClick={onDownload}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download instead
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ViewerToolbar filename={filename} onDownload={onDownload} />
      <div className="flex-1 relative">
        <Canvas
          data-testid="r3f-canvas"
          frameloop="demand"
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
        >
          <SceneSetup>
            <Suspense fallback={null}>
              {format === 'stl' ? (
                <StlModel url={url} />
              ) : (
                <GltfModel url={url} />
              )}
            </Suspense>
          </SceneSetup>
        </Canvas>
      </div>
    </div>
  );
};

export default ThreeDViewer;
