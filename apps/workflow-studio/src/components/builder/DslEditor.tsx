import React from 'react';
import { cn, CodeEditor } from '@airaie/ui';
import { useCanvasStore } from '@store/canvasStore';

const DslEditor: React.FC<{ className?: string }> = ({ className }) => {
  const dslYaml = useCanvasStore((s) => s.dslYaml);
  const setDslYaml = useCanvasStore((s) => s.setDslYaml);

  return (
    <div className={cn('flex-1 flex flex-col overflow-hidden', className)}>
      <div className="px-4 py-2 border-b border-surface-border bg-white">
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
          DSL — YAML Editor
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <CodeEditor
          value={dslYaml}
          onChange={setDslYaml}
          language="yaml"
          placeholder="# Workflow DSL definition..."
          minLines={20}
          className="h-full border-none"
        />
      </div>
    </div>
  );
};

DslEditor.displayName = 'DslEditor';

export default DslEditor;
