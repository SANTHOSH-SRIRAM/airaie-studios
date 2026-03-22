import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock vtk.js modules ────────────────────────────────────
// vtk.js requires WebGL and cannot run in jsdom.

const mockRenderer = {
  addActor: vi.fn(),
  resetCamera: vi.fn(),
};

const mockRenderWindow = {
  render: vi.fn(),
};

const mockGrw = {
  setContainer: vi.fn(),
  getRenderer: vi.fn(() => mockRenderer),
  getRenderWindow: vi.fn(() => mockRenderWindow),
  resize: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@kitware/vtk.js/Rendering/Profiles/Geometry', () => ({}));

vi.mock('@kitware/vtk.js/Rendering/Misc/GenericRenderWindow', () => ({
  default: { newInstance: vi.fn(() => mockGrw) },
}));

const mockCtf = {
  applyColorMap: vi.fn(),
  setMappingRange: vi.fn(),
  updateRange: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@kitware/vtk.js/Rendering/Core/ColorTransferFunction', () => ({
  default: { newInstance: vi.fn(() => mockCtf) },
}));

vi.mock('@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps', () => ({
  default: {
    getPresetByName: vi.fn((name: string) => ({ Name: name, ColorSpace: 'Diverging', RGBPoints: [] })),
  },
}));

const mockMapper = {
  setLookupTable: vi.fn(),
  setInputData: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@kitware/vtk.js/Rendering/Core/Mapper', () => ({
  default: { newInstance: vi.fn(() => mockMapper) },
}));

vi.mock('@kitware/vtk.js/Rendering/Core/Mapper/Constants', () => ({
  ColorMode: { MAP_SCALARS: 1 },
  ScalarMode: { USE_POINT_FIELD_DATA: 3, USE_CELL_FIELD_DATA: 4 },
}));

const mockActor = {
  setMapper: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@kitware/vtk.js/Rendering/Core/Actor', () => ({
  default: { newInstance: vi.fn(() => mockActor) },
}));

// Reader mocks
const mockScalarArray = {
  getName: vi.fn(() => 'Stress'),
  getRange: vi.fn(() => [0, 100]),
};

const mockPointData = {
  getScalars: vi.fn(() => mockScalarArray),
  getArrayByIndex: vi.fn(() => mockScalarArray),
  getNumberOfArrays: vi.fn(() => 1),
};

const mockCellData = {
  getScalars: vi.fn(() => null),
  getArrayByIndex: vi.fn(() => mockScalarArray),
  getNumberOfArrays: vi.fn(() => 1),
};

const mockOutputData = {
  getPointData: vi.fn(() => mockPointData),
  getCellData: vi.fn(() => mockCellData),
};

const mockVtpReader = {
  setUrl: vi.fn(() => Promise.resolve()),
  getOutputData: vi.fn(() => mockOutputData),
  delete: vi.fn(),
};

const mockVtuReader = {
  setUrl: vi.fn(() => Promise.resolve()),
  getOutputData: vi.fn(() => mockOutputData),
  delete: vi.fn(),
};

vi.mock('@kitware/vtk.js/IO/XML/XMLPolyDataReader', () => ({
  default: { newInstance: vi.fn(() => mockVtpReader) },
}));

vi.mock('@kitware/vtk.js/IO/XML/XMLUnstructuredGridReader', () => ({
  default: { newInstance: vi.fn(() => mockVtuReader) },
}));

// ─── Import after mocks ─────────────────────────────────────

import { VtkJsSimulationViewer } from './VtkJsSimulationViewer';
import type { ISimulationViewer } from './ISimulationViewer';

describe('VtkJsSimulationViewer', () => {
  let viewer: VtkJsSimulationViewer;

  beforeEach(() => {
    vi.clearAllMocks();
    viewer = new VtkJsSimulationViewer();
  });

  it('constructor creates a container div with width/height 100%', () => {
    const container = viewer.getContainer();
    expect(container).toBeInstanceOf(HTMLDivElement);
    expect(container.style.width).toBe('100%');
    expect(container.style.height).toBe('100%');
  });

  it('getContainer() returns the container div element', () => {
    const container = viewer.getContainer();
    expect(container.tagName).toBe('DIV');
  });

  it('dispose() calls delete() on all vtk objects', () => {
    viewer.dispose();
    expect(mockActor.delete).toHaveBeenCalled();
    expect(mockMapper.delete).toHaveBeenCalled();
    expect(mockCtf.delete).toHaveBeenCalled();
    expect(mockGrw.delete).toHaveBeenCalled();
  });

  it('loadFile() with .vtp URL creates XMLPolyDataReader', async () => {
    const vtpReaderModule = await import('@kitware/vtk.js/IO/XML/XMLPolyDataReader');
    await viewer.loadFile('https://example.com/mesh.vtp');
    expect(vtpReaderModule.default.newInstance).toHaveBeenCalled();
    expect(mockVtpReader.setUrl).toHaveBeenCalledWith('https://example.com/mesh.vtp', { loadData: true });
  });

  it('loadFile() with .vtu URL creates XMLUnstructuredGridReader', async () => {
    const vtuReaderModule = await import('@kitware/vtk.js/IO/XML/XMLUnstructuredGridReader');
    await viewer.loadFile('https://example.com/result.vtu');
    expect(vtuReaderModule.default.newInstance).toHaveBeenCalled();
    expect(mockVtuReader.setUrl).toHaveBeenCalledWith('https://example.com/result.vtu', { loadData: true });
  });

  it('setColorMap() applies named preset via applyColorMap', () => {
    viewer.setColorMap('Jet');
    expect(mockCtf.applyColorMap).toHaveBeenCalled();
    expect(mockCtf.updateRange).toHaveBeenCalled();
    expect(mockRenderWindow.render).toHaveBeenCalled();
  });

  it('setScalarRange() calls setMappingRange on color transfer function', () => {
    viewer.setScalarRange(10, 200);
    expect(mockCtf.setMappingRange).toHaveBeenCalledWith(10, 200);
    expect(mockCtf.updateRange).toHaveBeenCalled();
    expect(mockRenderWindow.render).toHaveBeenCalled();
  });

  it('class implements ISimulationViewer (type check)', () => {
    // Compile-time type check: assigning VtkJsSimulationViewer to ISimulationViewer
    const iface: ISimulationViewer = viewer;
    expect(typeof iface.loadFile).toBe('function');
    expect(typeof iface.setColorMap).toBe('function');
    expect(typeof iface.setScalarRange).toBe('function');
    expect(typeof iface.getContainer).toBe('function');
    expect(typeof iface.dispose).toBe('function');
  });

  it('resize() calls grw.resize()', () => {
    viewer.resize();
    expect(mockGrw.resize).toHaveBeenCalled();
  });
});
