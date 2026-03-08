import React, { useRef, useCallback, useState } from 'react';
import { cn } from '@airaie/ui';
import { useCanvasStore, type CanvasNode, type CanvasEdge } from '@store/canvasStore';
import CanvasGrid from './CanvasGrid';
import CanvasControls from './CanvasControls';
import CanvasNodeComponent from './CanvasNode';
import CanvasEdgeComponent from './CanvasEdge';
import type { PortDirection } from './CanvasPort';

const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 32;
const NODE_BODY_HEIGHT = 44;

let nodeIdCounter = 0;
function nextNodeId() {
  return `node_${++nodeIdCounter}_${Date.now()}`;
}

let edgeIdCounter = 0;
function nextEdgeId() {
  return `edge_${++edgeIdCounter}_${Date.now()}`;
}

const WorkflowCanvas: React.FC<{ className?: string }> = React.memo(({ className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdge = useCanvasStore((s) => s.addEdge);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const selectEdge = useCanvasStore((s) => s.selectEdge);

  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Edge creation state
  const [pendingConnection, setPendingConnection] = useState<{
    nodeId: string;
    portId: string;
    direction: PortDirection;
  } | null>(null);

  // --- Screen → Canvas coordinate conversion ---
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      };
    },
    [zoom, panX, panY]
  );

  // --- Port position helpers ---
  const getPortPosition = useCallback(
    (nodeId: string, portId: string): { x: number; y: number } => {
      const node = nodes.get(nodeId);
      if (!node) return { x: 0, y: 0 };
      const portY = node.y + NODE_HEADER_HEIGHT + NODE_BODY_HEIGHT / 2;
      return {
        x: portId === 'out' ? node.x + NODE_WIDTH : node.x,
        y: portY,
      };
    },
    [nodes]
  );

  // --- Connection handlers ---
  const handleConnectionStart = useCallback(
    (nodeId: string, portId: string, direction: PortDirection) => {
      setPendingConnection({ nodeId, portId, direction });
    },
    []
  );

  const handleConnectionEnd = useCallback(
    (nodeId: string, portId: string, direction: PortDirection) => {
      if (!pendingConnection) return;
      // Prevent self-connection and require output→input
      if (pendingConnection.nodeId === nodeId) {
        setPendingConnection(null);
        return;
      }

      const isSourceOutput = pendingConnection.direction === 'output';
      const isTargetInput = direction === 'input';

      if (isSourceOutput && isTargetInput) {
        const edge: CanvasEdge = {
          id: nextEdgeId(),
          sourceNodeId: pendingConnection.nodeId,
          sourcePort: pendingConnection.portId,
          targetNodeId: nodeId,
          targetPort: portId,
        };
        addEdge(edge);
      } else if (pendingConnection.direction === 'input' && direction === 'output') {
        // Reverse: target→source
        const edge: CanvasEdge = {
          id: nextEdgeId(),
          sourceNodeId: nodeId,
          sourcePort: portId,
          targetNodeId: pendingConnection.nodeId,
          targetPort: pendingConnection.portId,
        };
        addEdge(edge);
      }

      setPendingConnection(null);
    },
    [pendingConnection, addEdge]
  );

  // --- Pan handlers ---
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.target !== svgRef.current && !(e.target as Element).closest('[data-canvas-bg]')) return;
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
      selectNode(null);
      selectEdge(null);
      setPendingConnection(null);
    },
    [panX, panY, selectNode, selectEdge]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy);
    },
    [isPanning, setPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPendingConnection(null);
  }, []);

  // --- Zoom handler ---
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  // --- Drop handler ---
  const handleDragOver = useCallback((e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<SVGSVGElement>) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/airaie-node-type');
      const templateStr = e.dataTransfer.getData('application/airaie-node-template');
      if (!nodeType || !templateStr) return;

      const template = JSON.parse(templateStr) as { label: string; config: Record<string, unknown> };
      const pos = screenToCanvas(e.clientX, e.clientY);

      const node: CanvasNode = {
        id: nextNodeId(),
        type: nodeType as CanvasNode['type'],
        label: template.label,
        x: pos.x - 100,
        y: pos.y - 20,
        config: template.config,
      };

      addNode(node);
    },
    [screenToCanvas, addNode]
  );

  const nodesArray = Array.from(nodes.values());
  const edgesArray = Array.from(edges.values());

  return (
    <div className={cn('relative flex-1 overflow-hidden bg-canvas-bg', className)}>
      <svg
        ref={svgRef}
        className={cn('w-full h-full', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Background grid layer */}
        <g data-canvas-bg>
          <CanvasGrid />
        </g>

        {/* Transformed content layer */}
        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Edges layer */}
          <g data-layer="edges">
            {edgesArray.map((edge) => {
              const sourcePos = getPortPosition(edge.sourceNodeId, edge.sourcePort);
              const targetPos = getPortPosition(edge.targetNodeId, edge.targetPort);
              return (
                <CanvasEdgeComponent
                  key={edge.id}
                  edge={edge}
                  sourceX={sourcePos.x}
                  sourceY={sourcePos.y}
                  targetX={targetPos.x}
                  targetY={targetPos.y}
                />
              );
            })}
          </g>

          {/* Nodes layer */}
          <g data-layer="nodes">
            {nodesArray.map((node) => (
              <CanvasNodeComponent
                key={node.id}
                node={node}
                onConnectionStart={handleConnectionStart}
                onConnectionEnd={handleConnectionEnd}
              />
            ))}
          </g>
        </g>
      </svg>

      <CanvasControls />
    </div>
  );
});

WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;
