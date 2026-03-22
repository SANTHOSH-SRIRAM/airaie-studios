import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ISimulationViewer } from './vtk/ISimulationViewer';
import { isVtkFile } from './vtk/format-utils';
import { COLOR_MAP_PRESETS, DEFAULT_COLOR_MAP } from './vtk/color-maps';
import type { ColorMapName } from './vtk/color-maps';
import { ViewerError } from './shared/ViewerError';
import { ViewerToolbar } from './shared/ViewerToolbar';
import type { ViewerProps } from '@/types/viewer';

/** CSS gradient approximations for each color map preset. */
const COLOR_MAP_GRADIENTS: Record<string, string> = {
  'Cool to Warm': 'linear-gradient(to right, #3b4cc0, #dddcdc, #b40426)',
  'Jet': 'linear-gradient(to right, #00007f, #0000ff, #00ffff, #ffff00, #ff0000, #7f0000)',
  'Viridis (matplotlib)': 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)',
  'Grayscale': 'linear-gradient(to right, #000000, #ffffff)',
  'Blue to Red Rainbow': 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
};

const VtkHeatmapViewer: React.FC<ViewerProps> = ({ url, filename, onDownload }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<(ISimulationViewer & { resize?: () => void }) | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [colorMap, setColorMap] = useState<string>(DEFAULT_COLOR_MAP);
  const [scalarMin, setScalarMin] = useState(0);
  const [scalarMax, setScalarMax] = useState(1);

  // Format validation -- render error immediately if not VTK
  if (!isVtkFile(filename)) {
    return (
      <ViewerError
        message="Unsupported simulation format. Expected .vtp or .vtu file."
        filename={filename}
      />
    );
  }

  // Mount effect: dynamically import VtkJsSimulationViewer and load file
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { VtkJsSimulationViewer } = await import('./vtk/VtkJsSimulationViewer');
        if (cancelled) return;

        const viewer = new VtkJsSimulationViewer();
        viewerRef.current = viewer;

        // Append the viewer container to our ref div
        if (containerRef.current) {
          containerRef.current.appendChild(viewer.getContainer());
        }

        await viewer.loadFile(url);
        if (cancelled) return;

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [url]);

  // ResizeObserver effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      viewerRef.current?.resize?.();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Color map change handler
  const handleColorMapChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setColorMap(name);
    viewerRef.current?.setColorMap(name);
  }, []);

  // Scalar range change handler with 300ms debounce
  const handleScalarMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      setScalarMin(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        viewerRef.current?.setScalarRange(val, scalarMax);
      }, 300);
    },
    [scalarMax],
  );

  const handleScalarMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (isNaN(val)) return;
      setScalarMax(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        viewerRef.current?.setScalarRange(scalarMin, val);
      }, 300);
    },
    [scalarMin],
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const gradient = COLOR_MAP_GRADIENTS[colorMap] ?? COLOR_MAP_GRADIENTS[DEFAULT_COLOR_MAP];

  if (error) {
    return <ViewerError message={error} filename={filename} />;
  }

  return (
    <div className="flex flex-col h-full">
      <ViewerToolbar filename={filename} onDownload={onDownload}>
        <select
          value={colorMap}
          onChange={handleColorMapChange}
          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white"
          aria-label="Color map"
        >
          {COLOR_MAP_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.label}
            </option>
          ))}
        </select>
      </ViewerToolbar>

      {/* Controls bar: scalar range + color legend */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-surface-border bg-slate-50">
        <label htmlFor="vtk-scalar-min" className="text-xs text-content-secondary">
          Min:
        </label>
        <input
          id="vtk-scalar-min"
          type="number"
          value={scalarMin}
          onChange={handleScalarMinChange}
          step="any"
          className="w-20 text-xs border border-gray-300 rounded px-1.5 py-0.5"
          aria-label="Scalar min"
        />
        <label htmlFor="vtk-scalar-max" className="text-xs text-content-secondary">
          Max:
        </label>
        <input
          id="vtk-scalar-max"
          type="number"
          value={scalarMax}
          onChange={handleScalarMaxChange}
          step="any"
          className="w-20 text-xs border border-gray-300 rounded px-1.5 py-0.5"
          aria-label="Scalar max"
        />
        {/* Color legend bar */}
        <div className="flex-1 flex items-center gap-1">
          <span className="text-[10px] text-content-muted">{scalarMin}</span>
          <div
            className="flex-1 h-4 rounded"
            style={{ background: gradient }}
            role="img"
            aria-label="Color legend"
          />
          <span className="text-[10px] text-content-muted">{scalarMax}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-80 w-full">
          <span className="text-sm text-content-muted animate-pulse">Loading simulation...</span>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative" />
    </div>
  );
};

export default VtkHeatmapViewer;
