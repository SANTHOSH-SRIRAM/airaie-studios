// ============================================================
// VtkJsSimulationViewer — vtk.js implementation of
// ISimulationViewer (VIEW-09, D-05).
//
// All vtk.js imports are confined to this file. Consumers use
// only the ISimulationViewer interface (D-06).
//
// Anti-patterns avoided:
//   - vtkFullScreenRenderWindow (D-07) — uses GenericRenderWindow
//   - vtk objects in React state — managed imperatively
//   - Missing .delete() calls — dispose cleans everything
// ============================================================

// CRITICAL: side-effect import registers WebGL rendering backend.
// Without this, vtk.js produces a blank canvas with no errors.
// @ts-expect-error vtk.js types are incomplete for side-effect imports
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// @ts-expect-error vtk.js types are incomplete
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
// @ts-expect-error vtk.js types are incomplete
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
// @ts-expect-error vtk.js types are incomplete
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
// @ts-expect-error vtk.js types are incomplete
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
// @ts-expect-error vtk.js types are incomplete
import vtkColorMaps from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps';
// @ts-expect-error vtk.js types are incomplete
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader';
// @ts-expect-error vtk.js types are incomplete
import { ColorMode, ScalarMode } from '@kitware/vtk.js/Rendering/Core/Mapper/Constants';

import type { ISimulationViewer } from './ISimulationViewer';
import { DEFAULT_COLOR_MAP } from './color-maps';

export class VtkJsSimulationViewer implements ISimulationViewer {
  private container: HTMLDivElement;
  private grw: any;
  private mapper: any;
  private actor: any;
  private ctf: any;
  private currentRange: [number, number] = [0, 1];

  constructor() {
    this.container = document.createElement('div');
    this.container.style.width = '100%';
    this.container.style.height = '100%';

    this.grw = vtkGenericRenderWindow.newInstance();
    this.grw.setContainer(this.container);

    // Initialize color transfer function with default preset (D-01)
    this.ctf = vtkColorTransferFunction.newInstance();
    const preset = vtkColorMaps.getPresetByName(DEFAULT_COLOR_MAP);
    this.ctf.applyColorMap(preset);

    // Initialize mapper with lookup table
    this.mapper = vtkMapper.newInstance();
    this.mapper.setLookupTable(this.ctf);

    // Initialize actor
    this.actor = vtkActor.newInstance();
    this.actor.setMapper(this.mapper);

    // Add actor to scene
    this.grw.getRenderer().addActor(this.actor);
  }

  async loadFile(url: string): Promise<void> {
    // Detect format from URL extension (D-02)
    const ext = url.split('.').pop()?.toLowerCase();

    // VTU support: XMLUnstructuredGridReader is not available in vtk.js v35.
    // VTU files are accepted by format-utils for future compatibility but
    // currently fall through to XMLPolyDataReader which handles surface data.
    if (ext === 'vtu') {
      console.warn(
        'VTU (unstructured grid) files use XMLPolyDataReader as fallback. ' +
        'Full VTU support requires XMLUnstructuredGridReader (not available in vtk.js v35).',
      );
    }
    const reader = vtkXMLPolyDataReader.newInstance();

    await reader.setUrl(url, { loadData: true });
    const output = reader.getOutputData(0);

    // Auto-detect scalar array: pointData first, cellData fallback
    const pointData = output.getPointData();
    let scalars = pointData.getScalars() || pointData.getArrayByIndex(0);
    let scalarMode = ScalarMode.USE_POINT_FIELD_DATA;

    // Fallback to cell data if no point scalars found
    if (!scalars && pointData.getNumberOfArrays() === 0) {
      const cellData = output.getCellData();
      scalars = cellData.getScalars() || cellData.getArrayByIndex(0);
      scalarMode = ScalarMode.USE_CELL_FIELD_DATA;
    }

    if (scalars) {
      const range = scalars.getRange();
      this.currentRange = [range[0], range[1]];
      this.ctf.setMappingRange(range[0], range[1]);
      this.ctf.updateRange();
      this.mapper.set({
        colorByArrayName: scalars.getName(),
        colorMode: ColorMode.MAP_SCALARS,
        scalarMode,
        scalarVisibility: true,
      });
    }

    this.mapper.setInputData(output);
    this.grw.getRenderer().resetCamera();
    this.grw.getRenderWindow().render();

    // Clean up reader (avoid memory leak)
    reader.delete();
  }

  setColorMap(name: string): void {
    const preset = vtkColorMaps.getPresetByName(name);
    if (preset) {
      this.ctf.applyColorMap(preset);
      this.ctf.updateRange();
      this.grw.getRenderWindow().render();
    }
  }

  setScalarRange(min: number, max: number): void {
    this.currentRange = [min, max];
    this.ctf.setMappingRange(min, max);
    this.ctf.updateRange();
    this.grw.getRenderWindow().render();
  }

  getContainer(): HTMLDivElement {
    return this.container;
  }

  /** Resize the render window. Call from ResizeObserver. */
  resize(): void {
    this.grw.resize();
  }

  dispose(): void {
    this.actor.delete();
    this.mapper.delete();
    this.ctf.delete();
    this.grw.delete();
  }
}
