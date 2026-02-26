import React, { useState } from 'react';
import { cn, Button, Badge } from '@airaie/ui';
import { CheckCircle, Upload, Save, Play, Code, LayoutGrid } from 'lucide-react';
import { useCanvasStore } from '@store/canvasStore';

export type EditorMode = 'visual' | 'yaml';

export interface WorkflowToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onValidate?: () => void;
  onCompile?: () => void;
  onSave?: () => void;
  onPublish?: () => void;
  className?: string;
}

const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  mode,
  onModeChange,
  onValidate,
  onCompile,
  onSave,
  onPublish,
  className,
}) => {
  const isDirty = useCanvasStore((s) => s.isDirty);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 border-b border-surface-border bg-white',
        className
      )}
    >
      {/* Editable name */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className={cn(
          'text-sm font-medium text-content-primary bg-transparent border-none',
          'focus:outline-none focus:ring-0 hover:bg-surface-hover px-1 py-0.5',
          'w-48 truncate'
        )}
      />

      <Badge variant="info" badgeStyle="outline">
        v0.1.0
      </Badge>

      {isDirty && (
        <span className="w-2 h-2 bg-status-warning flex-shrink-0" title="Unsaved changes" />
      )}

      <div className="flex-1" />

      {/* Mode toggle */}
      <div className="flex border border-surface-border">
        <button
          onClick={() => onModeChange('visual')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'visual'
              ? 'bg-[#3b5fa8] text-white'
              : 'bg-white text-content-secondary hover:bg-surface-hover'
          )}
        >
          <LayoutGrid size={13} />
          Visual
        </button>
        <button
          onClick={() => onModeChange('yaml')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
            mode === 'yaml'
              ? 'bg-[#3b5fa8] text-white'
              : 'bg-white text-content-secondary hover:bg-surface-hover'
          )}
        >
          <Code size={13} />
          YAML
        </button>
      </div>

      <div className="w-px h-6 bg-surface-border" />

      {/* Action buttons */}
      <Button variant="outline" size="sm" icon={CheckCircle} onClick={onValidate}>
        Validate
      </Button>
      <Button variant="outline" size="sm" icon={Play} onClick={onCompile}>
        Compile
      </Button>
      <Button variant="secondary" size="sm" icon={Save} onClick={onSave}>
        Save
      </Button>
      <Button variant="primary" size="sm" icon={Upload} onClick={onPublish}>
        Publish
      </Button>
    </div>
  );
};

WorkflowToolbar.displayName = 'WorkflowToolbar';

export default WorkflowToolbar;
