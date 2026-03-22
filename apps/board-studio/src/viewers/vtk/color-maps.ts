// ============================================================
// Color map presets for simulation viewers.
// Names must match vtk.js ColorMaps.json preset names exactly.
// ============================================================

export const DEFAULT_COLOR_MAP = 'Cool to Warm';

export const COLOR_MAP_PRESETS = [
  { name: 'Cool to Warm', label: 'Cool to Warm (default)' },
  { name: 'Jet', label: 'Jet' },
  { name: 'Viridis (matplotlib)', label: 'Viridis' },
  { name: 'Grayscale', label: 'Grayscale' },
  { name: 'Blue to Red Rainbow', label: 'Rainbow' },
] as const;

export type ColorMapName = (typeof COLOR_MAP_PRESETS)[number]['name'];
