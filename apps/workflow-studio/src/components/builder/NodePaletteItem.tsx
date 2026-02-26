import React, { useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@airaie/ui';
import type { CanvasNode } from '@store/canvasStore';

export interface NodeTemplate {
  type: CanvasNode['type'];
  label: string;
  icon: LucideIcon;
  defaultConfig: Record<string, unknown>;
}

export interface NodePaletteItemProps {
  template: NodeTemplate;
  color: string;
}

const NodePaletteItem: React.FC<NodePaletteItemProps> = ({ template, color }) => {
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/airaie-node-type', template.type);
      e.dataTransfer.setData(
        'application/airaie-node-template',
        JSON.stringify({ label: template.label, config: template.defaultConfig })
      );
      e.dataTransfer.effectAllowed = 'copy';
    },
    [template]
  );

  const Icon = template.icon;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 cursor-grab active:cursor-grabbing',
        'border border-transparent hover:border-surface-border hover:bg-surface-hover',
        'transition-colors duration-100 select-none'
      )}
    >
      <div
        className="w-7 h-7 flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + '1a', color }}
      >
        <Icon size={15} />
      </div>
      <span className="text-sm text-content-primary truncate">{template.label}</span>
    </div>
  );
};

NodePaletteItem.displayName = 'NodePaletteItem';

export default NodePaletteItem;
