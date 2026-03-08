import React, { useState, useCallback } from 'react';
import { useCanvasStore } from '@store/canvasStore';
import { useUIStore } from '@store/uiStore';
import NodePalette from '@components/builder/NodePalette';
import WorkflowCanvas from '@components/builder/WorkflowCanvas';
import NodeInspector from '@components/builder/NodeInspector';
import WorkflowToolbar, { type EditorMode } from '@components/builder/WorkflowToolbar';
import DslEditor from '@components/builder/DslEditor';
import DiagnosticsPanel, { type Diagnostic } from '@components/builder/DiagnosticsPanel';
import {
  useCreateWorkflow,
  useCreateVersion,
  useCompileWorkflow,
  usePublishVersion,
  useValidateWorkflow,
} from '@hooks/useWorkflows';
import { serializeCanvasToDsl } from '@/utils/serializeCanvasToDsl';

interface WorkflowResponse {
  workflow?: { id: string };
  id?: string;
}

interface VersionResponse {
  version?: { version: number };
}

export default function BuilderPage() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const [mode, setMode] = useState<EditorMode>('visual');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);

  const createWorkflow = useCreateWorkflow();
  const createVersion = useCreateVersion();
  const compileWorkflow = useCompileWorkflow();
  const publishVersion = usePublishVersion();
  const validateWorkflow = useValidateWorkflow();

  const handleValidate = useCallback(() => {
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

    // Also run server-side validation
    const { nodes: n, edges: e } = useCanvasStore.getState();
    const dsl = serializeCanvasToDsl(n, e, useUIStore.getState().workflowName);
    validateWorkflow.mutate(
      { dsl },
      {
        onSuccess: (resp: any) => {
          if (resp?.valid) {
            results.push({ level: 'info', message: 'Server validation passed.' });
          } else if (resp?.errors) {
            for (const err of resp.errors) {
              results.push({ level: 'error', message: `Server: ${err.message}` });
            }
          }
          setDiagnostics(results);
        },
        onError: () => {
          // Fall back to local-only diagnostics
          if (results.length === 0) {
            results.push({ level: 'info', message: 'Validation passed — no issues found.' });
          }
          setDiagnostics(results);
        },
      }
    );

    if (results.length === 0) {
      results.push({ level: 'info', message: 'Validation passed — no issues found.' });
    }
    setDiagnostics(results);
  }, [validateWorkflow]);

  const handleCompile = useCallback(() => {
    const { workflowId } = useCanvasStore.getState();
    if (!workflowId) {
      setDiagnostics([{ level: 'error', message: 'Save the workflow first before compiling.' }]);
      return;
    }

    const { versionNumber } = useCanvasStore.getState();
    compileWorkflow.mutate(
      { dsl: { workflow_id: workflowId, version: versionNumber } },
      {
        onSuccess: (resp: any) => {
          if (resp?.valid) {
            setDiagnostics([{ level: 'info', message: 'Compilation succeeded.' }]);
          } else {
            const errors = (resp?.errors ?? []).map((e: any) => ({
              level: 'error' as const,
              message: `Compile: ${e.message}`,
            }));
            setDiagnostics(errors.length > 0 ? errors : [{ level: 'error', message: 'Compilation failed.' }]);
          }
        },
        onError: (err: Error) => {
          setDiagnostics([{ level: 'error', message: `Compile error: ${err.message}` }]);
        },
      }
    );
  }, [compileWorkflow]);

  const handleSave = useCallback(async () => {
    const { nodes, edges, workflowId } = useCanvasStore.getState();
    const dsl = serializeCanvasToDsl(nodes, edges, useUIStore.getState().workflowName);

    try {
      const displayName = useUIStore.getState().workflowName || 'Untitled Workflow';
      if (!workflowId) {
        // Create new workflow, then first version
        const wf = await createWorkflow.mutateAsync({
          name: displayName,
          description: '',
        });
        const wfResp = wf as unknown as WorkflowResponse;
        const wfId = wfResp?.workflow?.id ?? wfResp?.id ?? '';
        const ver = await createVersion.mutateAsync({ workflowId: wfId, dsl });
        const verResp = ver as unknown as VersionResponse;
        const vNum = verResp?.version?.version ?? 1;
        useCanvasStore.getState().setWorkflow(wfId, vNum);
        useCanvasStore.getState().setDirty(false);
        useUIStore.getState().setWorkflow(wfId, displayName);
        setDiagnostics([{ level: 'info', message: `Saved as new workflow (v${vNum}).` }]);
      } else {
        // Create new version for existing workflow
        const ver = await createVersion.mutateAsync({ workflowId, dsl });
        const verResp2 = ver as unknown as VersionResponse;
        const vNum = verResp2?.version?.version ?? useCanvasStore.getState().versionNumber + 1;
        useCanvasStore.getState().setWorkflow(workflowId, vNum);
        useCanvasStore.getState().setDirty(false);
        setDiagnostics([{ level: 'info', message: `Saved version ${vNum}.` }]);
      }
    } catch (err: any) {
      setDiagnostics([{ level: 'error', message: `Save failed: ${err.message}` }]);
    }
  }, [createWorkflow, createVersion]);

  const handlePublish = useCallback(async () => {
    const { workflowId, versionNumber } = useCanvasStore.getState();
    if (!workflowId || versionNumber < 1) {
      setDiagnostics([{ level: 'error', message: 'Save and compile the workflow first.' }]);
      return;
    }

    try {
      await publishVersion.mutateAsync({ workflowId, version: versionNumber });
      setDiagnostics([{ level: 'info', message: `Version ${versionNumber} published.` }]);
    } catch (err: any) {
      setDiagnostics([{ level: 'error', message: `Publish failed: ${err.message}` }]);
    }
  }, [publishVersion]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <WorkflowToolbar
        mode={mode}
        onModeChange={setMode}
        onValidate={handleValidate}
        onCompile={handleCompile}
        onSave={handleSave}
        onPublish={handlePublish}
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
