import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvasStore';
import type { CanvasNode, CanvasEdge } from '../canvasStore';

const makeNode = (id: string, overrides?: Partial<CanvasNode>): CanvasNode => ({
  id,
  type: 'control',
  label: `Node ${id}`,
  x: 0,
  y: 0,
  config: {},
  ...overrides,
});

const makeEdge = (id: string, source: string, target: string): CanvasEdge => ({
  id,
  sourceNodeId: source,
  sourcePort: 'out',
  targetNodeId: target,
  targetPort: 'in',
});

describe('canvasStore', () => {
  beforeEach(() => {
    useCanvasStore.getState().clearCanvas();
  });

  describe('defaults', () => {
    it('starts with empty nodes and edges', () => {
      const s = useCanvasStore.getState();
      expect(s.nodes.size).toBe(0);
      expect(s.edges.size).toBe(0);
    });

    it('starts with zoom 1 and pan 0,0', () => {
      const s = useCanvasStore.getState();
      expect(s.zoom).toBe(1);
      expect(s.panX).toBe(0);
      expect(s.panY).toBe(0);
    });

    it('starts not dirty', () => {
      expect(useCanvasStore.getState().isDirty).toBe(false);
    });
  });

  describe('addNode', () => {
    it('adds a node and sets dirty', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      const s = useCanvasStore.getState();
      expect(s.nodes.size).toBe(1);
      expect(s.nodes.get('n1')?.label).toBe('Node n1');
      expect(s.isDirty).toBe(true);
    });
  });

  describe('updateNode', () => {
    it('updates an existing node', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().updateNode('n1', { label: 'Updated', x: 100 });
      const node = useCanvasStore.getState().nodes.get('n1');
      expect(node?.label).toBe('Updated');
      expect(node?.x).toBe(100);
    });

    it('ignores update for non-existent node', () => {
      useCanvasStore.getState().updateNode('nonexistent', { label: 'X' });
      expect(useCanvasStore.getState().nodes.size).toBe(0);
    });
  });

  describe('removeNode', () => {
    it('removes a node', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().removeNode('n1');
      expect(useCanvasStore.getState().nodes.size).toBe(0);
    });

    it('removes connected edges when node is removed', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().addNode(makeNode('n2'));
      useCanvasStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'));
      expect(useCanvasStore.getState().edges.size).toBe(1);

      useCanvasStore.getState().removeNode('n1');
      expect(useCanvasStore.getState().edges.size).toBe(0);
    });

    it('deselects node if it was selected', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().selectNode('n1');
      useCanvasStore.getState().removeNode('n1');
      expect(useCanvasStore.getState().selectedNodeId).toBeNull();
    });

    it('keeps selection if different node is removed', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().addNode(makeNode('n2'));
      useCanvasStore.getState().selectNode('n1');
      useCanvasStore.getState().removeNode('n2');
      expect(useCanvasStore.getState().selectedNodeId).toBe('n1');
    });
  });

  describe('edges', () => {
    it('adds and removes edges', () => {
      useCanvasStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'));
      expect(useCanvasStore.getState().edges.size).toBe(1);

      useCanvasStore.getState().removeEdge('e1');
      expect(useCanvasStore.getState().edges.size).toBe(0);
    });

    it('deselects edge when removed', () => {
      useCanvasStore.getState().addEdge(makeEdge('e1', 'n1', 'n2'));
      useCanvasStore.getState().selectEdge('e1');
      useCanvasStore.getState().removeEdge('e1');
      expect(useCanvasStore.getState().selectedEdgeId).toBeNull();
    });
  });

  describe('selection', () => {
    it('selectNode clears edge selection', () => {
      useCanvasStore.getState().selectEdge('e1');
      useCanvasStore.getState().selectNode('n1');
      const s = useCanvasStore.getState();
      expect(s.selectedNodeId).toBe('n1');
      expect(s.selectedEdgeId).toBeNull();
    });

    it('selectEdge clears node selection', () => {
      useCanvasStore.getState().selectNode('n1');
      useCanvasStore.getState().selectEdge('e1');
      const s = useCanvasStore.getState();
      expect(s.selectedEdgeId).toBe('e1');
      expect(s.selectedNodeId).toBeNull();
    });
  });

  describe('zoom', () => {
    it('clamps zoom to min 0.1', () => {
      useCanvasStore.getState().setZoom(0.01);
      expect(useCanvasStore.getState().zoom).toBe(0.1);
    });

    it('clamps zoom to max 3', () => {
      useCanvasStore.getState().setZoom(5);
      expect(useCanvasStore.getState().zoom).toBe(3);
    });

    it('allows zoom within range', () => {
      useCanvasStore.getState().setZoom(1.5);
      expect(useCanvasStore.getState().zoom).toBe(1.5);
    });
  });

  describe('setDslYaml', () => {
    it('sets yaml and marks dirty', () => {
      useCanvasStore.getState().setDslYaml('nodes: []');
      const s = useCanvasStore.getState();
      expect(s.dslYaml).toBe('nodes: []');
      expect(s.isDirty).toBe(true);
    });
  });

  describe('setWorkflow', () => {
    it('sets workflow id and version number', () => {
      useCanvasStore.getState().setWorkflow('wf_123', 3);
      const s = useCanvasStore.getState();
      expect(s.workflowId).toBe('wf_123');
      expect(s.versionNumber).toBe(3);
    });
  });

  describe('clearCanvas', () => {
    it('resets all state to defaults', () => {
      useCanvasStore.getState().addNode(makeNode('n1'));
      useCanvasStore.getState().setZoom(2);
      useCanvasStore.getState().setWorkflow('wf_1', 5);
      useCanvasStore.getState().clearCanvas();

      const s = useCanvasStore.getState();
      expect(s.nodes.size).toBe(0);
      expect(s.edges.size).toBe(0);
      expect(s.zoom).toBe(1);
      expect(s.isDirty).toBe(false);
      expect(s.workflowId).toBeNull();
    });
  });
});
