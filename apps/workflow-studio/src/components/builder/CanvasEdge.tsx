import React from 'react';
import { useCanvasStore, type CanvasEdge as CanvasEdgeType } from '@store/canvasStore';

const CONTROL_OFFSET = 80;

export interface CanvasEdgeProps {
  edge: CanvasEdgeType;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

const CanvasEdgeComponent: React.FC<CanvasEdgeProps> = ({
  edge,
  sourceX,
  sourceY,
  targetX,
  targetY,
}) => {
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const selectEdge = useCanvasStore((s) => s.selectEdge);

  const isSelected = selectedEdgeId === edge.id;

  // Cubic bezier with horizontal control point offsets
  const d = `M ${sourceX} ${sourceY} C ${sourceX + CONTROL_OFFSET} ${sourceY}, ${targetX - CONTROL_OFFSET} ${targetY}, ${targetX} ${targetY}`;

  return (
    <g>
      {/* Invisible wider path for click target */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          selectEdge(edge.id);
        }}
      />
      {/* Visible edge */}
      <path
        d={d}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#cbd5e1'}
        strokeWidth={isSelected ? 2.5 : 2}
        className="pointer-events-none transition-colors"
      />
    </g>
  );
};

CanvasEdgeComponent.displayName = 'CanvasEdge';

export default CanvasEdgeComponent;
