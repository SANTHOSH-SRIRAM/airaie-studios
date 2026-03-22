// ============================================================
// ISimulationViewer — Abstraction interface for simulation
// rendering engines (VIEW-09, D-05, D-06).
//
// Consumers import ONLY this interface, never vtk.js directly.
// Current implementation: VtkJsSimulationViewer (vtk.js)
// Future implementation: VtkWasmSimulationViewer (vtk.wasm)
// ============================================================

export interface ISimulationViewer {
  /** Load and render a VTK file (VTP or VTU) from the given URL. */
  loadFile(url: string): Promise<void>;

  /** Apply a named color map preset (e.g. 'Cool to Warm', 'Jet'). */
  setColorMap(name: string): void;

  /** Set the scalar range for color mapping. */
  setScalarRange(min: number, max: number): void;

  /** Return the container div element managed by this viewer. */
  getContainer(): HTMLDivElement;

  /** Dispose all rendering resources. Must be called on unmount. */
  dispose(): void;
}
