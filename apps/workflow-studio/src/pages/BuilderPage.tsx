import React, { useState } from 'react';
import { useCanvasStore } from '@store/canvasStore';
import NodePalette from '@components/builder/NodePalette';
import WorkflowCanvas from '@components/builder/WorkflowCanvas';
import NodeInspector from '@components/builder/NodeInspector';
import WorkflowToolbar, { type EditorMode } from '@components/builder/WorkflowToolbar';
import DslEditor from '@components/builder/DslEditor';
import DiagnosticsPanel, { type Diagnostic } from '@components/builder/DiagnosticsPanel';

export default function BuilderPage() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  const handleValidate = () => {
    const nodes = useCanvasStore.getState().nodes;
    const results: Diagnostic[] = [];

    if (nodes.size === 0) {
      results.push({ level: 'warning', message: 'Workflow has no nodes.' });
    }

    const hasStart = Array.from(nodes.values()).some(
      (n) => n.type === 'control' && n.config.kind === 'start'
    );
    if (!hasStart && nodes.size > 0) {
      results.push({ level: 'error', message: 'Workflow is missing a Start node.' });
    }

    const hasEnd = Array.from(nodes.values()).some(
      (n) => n.type === 'control' && n.config.kind === 'end'
    );
    if (!hasEnd && nodes.size > 0) {
      results.push({ level: 'warning', message: 'Workflow has no End node.' });
    }

    if (results.length === 0) {
      results.push({ level: 'info', message: 'Validation passed — no issues found.' });
    }

    setDiagnostics(results);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <WorkflowToolbar
        mode={mode}
        onModeChange={setMode}
        onValidate={handleValidate}
      />

      {/* Main 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Node Palette */}
        <NodePalette />

        {/* Center: Canvas or DSL Editor */}
        {mode === 'visual' ? (
          <WorkflowCanvas />
        ) : (
          <DslEditor />
        )}

        {/* Right: Node Inspector (conditional) */}
        {mode === 'visual' && selectedNodeId && <NodeInspector />}
      </div>

      {/* Bottom: Diagnostics Panel */}
      <DiagnosticsPanel diagnostics={diagnostics} />
    </div>
  );
}
