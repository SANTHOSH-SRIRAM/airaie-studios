import React from 'react';
import { cn } from '@airaie/ui';
import type { CanvasNode } from '@store/canvasStore';

export interface InputBindingRowProps {
  inputName: string;
  sourceNodeId: string;
  availableNodes: CanvasNode[];
  onChange: (sourceNodeId: string) => void;
}

const InputBindingRow: React.FC<InputBindingRowProps> = ({
  inputName,
  sourceNodeId,
  availableNodes,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-content-secondary w-28 truncate flex-shrink-0">
        {inputName}
      </span>
      <select
        value={sourceNodeId}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex-1 h-8 px-2 text-sm bg-white border border-surface-border rounded-none appearance-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary'
        )}
      >
        <option value="">— none —</option>
        {availableNodes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label} ({n.type})
          </option>
        ))}
      </select>
    </div>
  );
};

InputBindingRow.displayName = 'InputBindingRow';

export default InputBindingRow;
