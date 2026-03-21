import React, { useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Skeleton } from '@airaie/ui';
import { ViewerError } from './shared/ViewerError';
import type { ViewerProps } from '@/types/viewer';

const Controls: React.FC = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
      <button
        onClick={() => zoomIn()}
        className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
        aria-label="Zoom in"
      >
        <ZoomIn size={16} />
      </button>
      <button
        onClick={() => zoomOut()}
        className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
        aria-label="Zoom out"
      >
        <ZoomOut size={16} />
      </button>
      <button
        onClick={() => resetTransform()}
        className="p-1.5 bg-white/90 rounded shadow hover:bg-white"
        aria-label="Reset zoom"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};

const ImageViewer: React.FC<ViewerProps> = ({ url, filename }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <ViewerError message="Failed to load image" filename={filename} />;
  }

  return (
    <div className="relative h-full w-full bg-slate-50 rounded overflow-hidden">
      {!loaded && <Skeleton className="h-64 w-full" />}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
      >
        <Controls />
        <TransformComponent>
          <img
            src={url}
            alt={filename ?? 'Image preview'}
            draggable={false}
            className={loaded ? 'max-w-full max-h-full object-contain' : 'hidden'}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default ImageViewer;
