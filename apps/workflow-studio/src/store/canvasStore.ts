import { create } from 'zustand';

export interface CanvasNode {
  id: string;
  type: 'control' | 'board' | 'agent' | 'human' | 'system';
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  toolRef?: string;
}

export interface CanvasEdge {
  id: string;
  sourceNodeId: string;
  sourcePort: string;
  targetNodeId: string;
  targetPort: string;
}

interface CanvasState {
  nodes: Map<string, CanvasNode>;
  edges: Map<string, CanvasEdge>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  dslYaml: string;
  isDirty: boolean;

  addNode: (node: CanvasNode) => void;
  updateNode: (id: string, partial: Partial<CanvasNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: CanvasEdge) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setDslYaml: (yaml: string) => void;
  setDirty: (dirty: boolean) => void;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: new Map(),
  edges: new Map(),
  selectedNodeId: null,
  selectedEdgeId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  dslYaml: '',
  isDirty: false,

  addNode: (node) =>
    set((s) => {
      const nodes = new Map(s.nodes);
      nodes.set(node.id, node);
      return { nodes, isDirty: true };
    }),
  updateNode: (id, partial) =>
    set((s) => {
      const nodes = new Map(s.nodes);
      const existing = nodes.get(id);
      if (existing) nodes.set(id, { ...existing, ...partial });
      return { nodes, isDirty: true };
    }),
  removeNode: (id) =>
    set((s) => {
      const nodes = new Map(s.nodes);
      nodes.delete(id);
      const edges = new Map(s.edges);
      for (const [eid, edge] of edges) {
        if (edge.sourceNodeId === id || edge.targetNodeId === id) edges.delete(eid);
      }
      return { nodes, edges, isDirty: true, selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId };
    }),
  addEdge: (edge) =>
    set((s) => {
      const edges = new Map(s.edges);
      edges.set(edge.id, edge);
      return { edges, isDirty: true };
    }),
  removeEdge: (id) =>
    set((s) => {
      const edges = new Map(s.edges);
      edges.delete(id);
      return { edges, isDirty: true, selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId };
    }),
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (panX, panY) => set({ panX, panY }),
  setDslYaml: (dslYaml) => set({ dslYaml, isDirty: true }),
  setDirty: (isDirty) => set({ isDirty }),
  clearCanvas: () =>
    set({
      nodes: new Map(),
      edges: new Map(),
      selectedNodeId: null,
      selectedEdgeId: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      dslYaml: '',
      isDirty: false,
    }),
}));
