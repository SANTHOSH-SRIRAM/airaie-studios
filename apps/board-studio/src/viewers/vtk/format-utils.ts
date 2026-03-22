// ============================================================
// VTK format detection utilities.
// Used by viewer registry and heatmap viewer to identify
// VTP (polydata) and VTU (unstructured grid) files.
// ============================================================

export type VtkFormat = 'vtp' | 'vtu';

/**
 * Detect VTK format from filename extension.
 * Returns 'vtp', 'vtu', or null if not a VTK file.
 */
export function getVtkFormat(filename: string | undefined): VtkFormat | null {
  if (!filename) return null;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'vtp') return 'vtp';
  if (ext === 'vtu') return 'vtu';
  return null;
}

/**
 * Check whether a filename has a supported VTK extension.
 */
export function isVtkFile(filename: string | undefined): boolean {
  return getVtkFormat(filename) !== null;
}
