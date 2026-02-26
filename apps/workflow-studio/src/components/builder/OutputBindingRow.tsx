import React from 'react';

export interface OutputBindingRowProps {
  outputName: string;
  connectedTo: string;
}

const OutputBindingRow: React.FC<OutputBindingRowProps> = ({ outputName, connectedTo }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-content-secondary w-28 truncate flex-shrink-0">
        {outputName}
      </span>
      <span className="text-sm text-content-muted">
        {connectedTo || '— unconnected —'}
      </span>
    </div>
  );
};

OutputBindingRow.displayName = 'OutputBindingRow';

export default OutputBindingRow;
