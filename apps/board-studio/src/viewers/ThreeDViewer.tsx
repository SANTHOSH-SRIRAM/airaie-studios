import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useQuery } from '@tanstack/react-query';
import { ViewerError } from './shared/ViewerError';
import { ViewerToolbar } from './shared/ViewerToolbar';
import { SceneSetup } from './three/SceneSetup';
import { StlModel } from './three/StlModel';
import { GltfModel } from './three/GltfModel';
import { isConvertible, useConvertedArtifact, getDownloadURL } from '@airaie/shared';
import type { ViewerProps } from '@/types/viewer';

type ModelFormat = 'stl' | 'gltf' | 'glb' | 'convertible';

const MAX_SIZE_BYTES = 52_428_800; // 50MB

export function getModelFormat(filename: string | undefined): ModelFormat | null {
  if (!filename) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'stl') return 'stl';
  if (ext === 'gltf') return 'gltf';
  if (ext === 'glb') return 'glb';
  if (isConvertible(filename)) return 'convertible';
  return null;
}

/** Renders a STEP/IGES file by checking for cached GLTF conversion. */
const ConvertibleModelViewer: React.FC<{
  artifactId: string;
  filename?: string;
  onDownload?: () => void;
}> = ({ artifactId, filename, onDownload }) => {
  const {
    cachedGltfId,
    isCheckingLineage,
    convertMutation,
  } = useConvertedArtifact(artifactId, filename);

  // Fetch download URL for the cached GLTF artifact
  const { data: downloadData } = useQuery({
    queryKey: ['artifacts', cachedGltfId, 'download-url'] as const,
    queryFn: () => getDownloadURL(cachedGltfId!),
    enabled: !!cachedGltfId,
  });

  // Loading state while checking lineage
  if (isCheckingLineage) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <div className="animate-pulse text-sm">Checking for converted model...</div>
      </div>
    );
  }

  // Cached GLTF found and URL resolved -- render it
  if (cachedGltfId && downloadData?.download_url) {
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
                <GltfModel url={downloadData.download_url} />
              </Suspense>
            </SceneSetup>
          </Canvas>
        </div>
      </div>
    );
  }

  // Conversion failed
  if (convertMutation.isError) {
    return (
      <div className="flex flex-col h-full">
        <ViewerError
          message="Failed to convert CAD file. The conversion service may not be configured yet."
          filename={filename}
        />
        {onDownload && (
          <div className="flex justify-center pb-4">
            <button
              onClick={onDownload}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download original file
            </button>
          </div>
        )}
      </div>
    );
  }

  // Conversion in progress
  if (convertMutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
        <div className="animate-pulse text-sm">Converting CAD file to GLTF...</div>
      </div>
    );
  }

  // No cache, no conversion attempted -- show conversion prompt with download fallback
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
      <p className="text-sm">
        This STEP/IGES file requires conversion to view in the browser.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => convertMutation.mutate()}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Convert to 3D preview
        </button>
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-3 py-1.5 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Download original
          </button>
        )}
      </div>
    </div>
  );
};

const ThreeDViewer: React.FC<ViewerProps> = ({ url, filename, sizeBytes, artifactId, onDownload }) => {
  const format = getModelFormat(filename);

  if (!format) {
    return <ViewerError message="Unsupported 3D format" filename={filename} />;
  }

  // STEP/IGES conversion flow
  if (format === 'convertible') {
    if (!artifactId) {
      return (
        <div className="flex flex-col h-full">
          <ViewerError
            message="STEP/IGES preview requires conversion — download to view"
            filename={filename}
          />
          {onDownload && (
            <div className="flex justify-center pb-4">
              <button
                onClick={onDownload}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Download file
              </button>
            </div>
          )}
        </div>
      );
    }
    return (
      <ConvertibleModelViewer
        artifactId={artifactId}
        filename={filename}
        onDownload={onDownload}
      />
    );
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
