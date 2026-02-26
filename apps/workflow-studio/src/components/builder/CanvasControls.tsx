import React from 'react';
import { cn } from '@airaie/ui';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useCanvasStore } from '@store/canvasStore';

const CanvasControls: React.FC<{ className?: string }> = ({ className }) => {
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);

  const fitToView = () => {
    setZoom(1);
    setPan(0, 0);
  };

  return (
    <div
      className={cn(
        'absolute bottom-4 right-4 flex items-center gap-1 bg-white border border-surface-border shadow-card',
        className
      )}
    >
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="p-1.5 hover:bg-surface-hover transition-colors text-content-secondary"
        title="Zoom Out"
      >
        <ZoomOut size={16} />
      </button>
      <span className="text-xs text-content-secondary w-12 text-center tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="p-1.5 hover:bg-surface-hover transition-colors text-content-secondary"
        title="Zoom In"
      >
        <ZoomIn size={16} />
      </button>
      <div className="w-px h-5 bg-surface-border" />
      <button
        onClick={fitToView}
        className="p-1.5 hover:bg-surface-hover transition-colors text-content-secondary"
        title="Fit to View"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
};

CanvasControls.displayName = 'CanvasControls';

export default CanvasControls;
