import React from 'react';
import { cn, Button, Input, CodeEditor } from '@airaie/ui';
import { Save, X } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useEvalCases, useCreateEvalCase, useUpdateEvalCase } from '@hooks/useEvals';

export interface TestCaseEditorProps {
  testCaseId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

const TestCaseEditor: React.FC<TestCaseEditorProps> = ({ testCaseId, onSave, onCancel }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: evalCases } = useEvalCases(agentId);
  const createMutation = useCreateEvalCase();
  const updateMutation = useUpdateEvalCase();

  const existing = testCaseId ? evalCases?.find((tc) => tc.id === testCaseId) : null;

  const [name, setName] = React.useState(existing?.name ?? '');
  const [inputJson, setInputJson] = React.useState(existing ? JSON.stringify(existing.inputs, null, 2) : '{}');
  const [minActions, setMinActions] = React.useState<string>(existing?.criteria.min_actions?.toString() ?? '');
  const [maxActions, setMaxActions] = React.useState<string>(existing?.criteria.max_actions?.toString() ?? '');
  const [minScore, setMinScore] = React.useState<string>(existing?.criteria.min_score?.toString() ?? '');
  const [maxCost, setMaxCost] = React.useState<string>(existing?.criteria.max_cost?.toString() ?? '');
  const [requiredTools, setRequiredTools] = React.useState(existing?.criteria.required_tools?.join(', ') ?? '');
  const [forbiddenTools, setForbiddenTools] = React.useState(existing?.criteria.forbidden_tools?.join(', ') ?? '');

  const handleSave = async () => {
    let parsedInput: Record<string, unknown>;
    try { parsedInput = JSON.parse(inputJson); } catch { return; }

    const criteria: Record<string, unknown> = {
      ...(minActions ? { min_actions: Number(minActions) } : {}),
      ...(maxActions ? { max_actions: Number(maxActions) } : {}),
      ...(minScore ? { min_score: Number(minScore) } : {}),
      ...(maxCost ? { max_cost: Number(maxCost) } : {}),
      ...(requiredTools.trim() ? { required_tools: requiredTools.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(forbiddenTools.trim() ? { forbidden_tools: forbiddenTools.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
    };

    if (existing) {
      await updateMutation.mutateAsync({ agentId, evalId: existing.id, name, inputs: parsedInput, criteria });
    } else {
      await createMutation.mutateAsync({ agentId, name, inputs: parsedInput, criteria });
    }
    onSave();
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-content-secondary">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test case name" />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-content-secondary">Input JSON</label>
        <CodeEditor language="json" value={inputJson} onChange={(v) => setInputJson(v ?? '')} className="h-32" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Criteria</span>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-content-muted">Min Actions</label>
            <Input type="number" value={minActions} onChange={(e) => setMinActions(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-content-muted">Max Actions</label>
            <Input type="number" value={maxActions} onChange={(e) => setMaxActions(e.target.value)} placeholder="--" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-content-muted">Min Score (0-1)</label>
            <Input type="number" step="0.01" min="0" max="1" value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="0.8" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-content-muted">Max Cost</label>
            <Input type="number" step="0.01" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} placeholder="--" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-content-muted">Required Tools (comma-separated)</label>
          <Input value={requiredTools} onChange={(e) => setRequiredTools(e.target.value)} placeholder="tool_a, tool_b" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-content-muted">Forbidden Tools (comma-separated)</label>
          <Input value={forbiddenTools} onChange={(e) => setForbiddenTools(e.target.value)} placeholder="tool_x" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" icon={X} onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={!name.trim()} loading={saving}>Save</Button>
      </div>
    </div>
  );
};

TestCaseEditor.displayName = 'TestCaseEditor';

export default TestCaseEditor;
