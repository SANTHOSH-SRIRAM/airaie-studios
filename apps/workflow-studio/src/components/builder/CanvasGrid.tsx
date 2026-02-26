import React from 'react';

const MINOR_SPACING = 20;
const MAJOR_SPACING = 100;

const CanvasGrid: React.FC = () => (
  <>
    <defs>
      <pattern
        id="grid-minor"
        width={MINOR_SPACING}
        height={MINOR_SPACING}
        patternUnits="userSpaceOnUse"
      >
        <circle cx={1} cy={1} r={0.8} className="fill-canvas-grid" />
      </pattern>
      <pattern
        id="grid-major"
        width={MAJOR_SPACING}
        height={MAJOR_SPACING}
        patternUnits="userSpaceOnUse"
      >
        <rect width={MAJOR_SPACING} height={MAJOR_SPACING} fill="url(#grid-minor)" />
        <circle cx={1} cy={1} r={1.5} className="fill-canvas-grid-major" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-major)" />
  </>
);

CanvasGrid.displayName = 'CanvasGrid';

export default CanvasGrid;
