import React, { useCallback, useRef, useState } from 'react';
import { cn } from '@airaie/ui';
import { useCanvasStore, type CanvasNode as CanvasNodeType } from '@store/canvasStore';
import CanvasPort, { type PortDirection } from './CanvasPort';

const NODE_WIDTH = 200;
const NODE_HEADER_HEIGHT = 32;
const NODE_BODY_HEIGHT = 44;
const NODE_HEIGHT = NODE_HEADER_HEIGHT + NODE_BODY_HEIGHT;

const typeColors: Record<CanvasNodeType['type'], string> = {
  control: '#f59e0b',
  board: '#3b82f6',
  agent: '#8b5cf6',
  human: '#22c55e',
  system: '#06b6d4',
};

const typeLabels: Record<CanvasNodeType['type'], string> = {
  control: 'Control',
  board: 'Board',
  agent: 'Agent',
  human: 'Human',
  system: 'System',
};

export interface CanvasNodeProps {
  node: CanvasNodeType;
  onConnectionStart?: (nodeId: string, portId: string, direction: PortDirection) => void;
  onConnectionEnd?: (nodeId: string, portId: string, direction: PortDirection) => void;
}

const CanvasNodeComponent: React.FC<CanvasNodeProps> = ({
  node,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const updateNode = useCanvasStore((s) => s.updateNode);

  const isSelected = selectedNodeId === node.id;
  const color = typeColors[node.type];

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(node.id);
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };

      const handleMouseMove = (ev: MouseEvent) => {
        const zoom = useCanvasStore.getState().zoom;
        const dx = (ev.clientX - dragStartRef.current.x) / zoom;
        const dy = (ev.clientY - dragStartRef.current.y) / zoom;
        updateNode(node.id, {
          x: dragStartRef.current.nodeX + dx,
          y: dragStartRef.current.nodeY + dy,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [node.id, node.x, node.y, selectNode, updateNode]
  );

  // Port positions
  const inputPortY = NODE_HEADER_HEIGHT + NODE_BODY_HEIGHT / 2;
  const outputPortY = inputPortY;

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {/* Node body */}
      <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'w-full h-full bg-white border-2 select-none',
            isDragging ? 'cursor-grabbing' : 'cursor-grab',
            isSelected ? 'border-[#3b82f6] shadow-md' : 'border-surface-border shadow-card'
          )}
          style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
        >
          {/* Color header bar */}
          <div
            className="flex items-center gap-2 px-3 text-white text-xs font-medium uppercase tracking-wide"
            style={{ backgroundColor: color, height: NODE_HEADER_HEIGHT }}
          >
            <span className="truncate">{typeLabels[node.type]}</span>
          </div>
          {/* Body */}
          <div
            className="flex items-center px-3 text-sm text-content-primary truncate"
            style={{ height: NODE_BODY_HEIGHT }}
          >
            {node.label}
          </div>
        </div>
      </foreignObject>

      {/* Input port (left) */}
      <CanvasPort
        nodeId={node.id}
        portId="in"
        direction="input"
        cx={0}
        cy={inputPortY}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
      />

      {/* Output port (right) */}
      <CanvasPort
        nodeId={node.id}
        portId="out"
        direction="output"
        cx={NODE_WIDTH}
        cy={outputPortY}
        onConnectionStart={onConnectionStart}
        onConnectionEnd={onConnectionEnd}
      />
    </g>
  );
};

CanvasNodeComponent.displayName = 'CanvasNode';

export default CanvasNodeComponent;
