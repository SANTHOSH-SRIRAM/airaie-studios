import React from 'react';

export interface LineageNodeProps {
  id: string;
  label: string;
  x: number;
  y: number;
  isActive: boolean;
  onClick: () => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;

const LineageNode: React.FC<LineageNodeProps> = ({ label, x, y, isActive, onClick }) => {
  const truncated = label.length > 14 ? `${label.slice(0, 12)}...` : label;

  return (
    <g
      onClick={onClick}
      className="cursor-pointer"
      role="button"
      tabIndex={0}
    >
      <rect
        x={x}
        y={y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        fill="white"
        stroke={isActive ? '#1e40af' : '#e2e8f0'}
        strokeWidth={isActive ? 2 : 1}
        className="transition-colors hover:stroke-[#94a3b8]"
      />
      <text
        x={x + NODE_WIDTH / 2}
        y={y + NODE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs fill-current text-content-primary pointer-events-none select-none"
      >
        {truncated}
      </text>
    </g>
  );
};

LineageNode.displayName = 'LineageNode';

export default LineageNode;
