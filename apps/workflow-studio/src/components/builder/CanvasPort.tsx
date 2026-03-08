import React, { useCallback } from 'react';
import { cn } from '@airaie/ui';

export type PortDirection = 'input' | 'output';

export interface CanvasPortProps {
  nodeId: string;
  portId: string;
  direction: PortDirection;
  cx: number;
  cy: number;
  onConnectionStart?: (nodeId: string, portId: string, direction: PortDirection) => void;
  onConnectionEnd?: (nodeId: string, portId: string, direction: PortDirection) => void;
}

const PORT_RADIUS = 6;

const CanvasPort: React.FC<CanvasPortProps> = ({
  nodeId,
  portId,
  direction,
  cx,
  cy,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onConnectionStart?.(nodeId, portId, direction);
    },
    [nodeId, portId, direction, onConnectionStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onConnectionEnd?.(nodeId, portId, direction);
    },
    [nodeId, portId, direction, onConnectionEnd]
  );

  return (
    <circle
      cx={cx}
      cy={cy}
      r={PORT_RADIUS}
      className="fill-white stroke-[#cbd5e1] stroke-2 cursor-crosshair hover:fill-[#1e40af] hover:stroke-[#1e40af] transition-colors"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      data-port-id={portId}
      data-port-direction={direction}
      data-node-id={nodeId}
    />
  );
};

CanvasPort.displayName = 'CanvasPort';

export default CanvasPort;
