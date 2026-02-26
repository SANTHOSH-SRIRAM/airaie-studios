import React, { useState } from 'react';
import { cn, Button, Badge, CodeEditor, Spinner, Card, formatCost } from '@airaie/ui';
import { Play } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useRunAgent } from '@hooks/useAgentRun';

const GuardrailTestRunner: React.FC<{ className?: string }> = ({ className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const [inputJson, setInputJson] = useState('{}');
  const [version, setVersion] = useState(1);
  const { mutate, data, isPending, isError, error } = useRunAgent();

  const handleRun = () => {
    let inputs: Record<string, unknown> = {};
    try {
      inputs = JSON.parse(inputJson);
    } catch {
      return;
    }
    mutate({ agentId, version, inputs, dryRun: true });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <Card.Body className="space-y-4">
          <label className="text-sm font-medium text-content-primary block">
            Guardrail Test Runner
          </label>

          <CodeEditor
            value={inputJson}
            onChange={setInputJson}
            language="json"
            className="min-h-[120px]"
          />

          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-content-secondary block">Version</label>
              <input
                type="number"
                min={1}
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
                className="w-20 border border-slate-200 bg-white px-2 py-1 text-sm text-content-primary rounded-none"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={handleRun}
              disabled={isPending || !agentId}
            >
              Run Test
            </Button>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 py-3">
              <Spinner size="sm" />
              <span className="text-sm text-content-muted">Running dry-run...</span>
            </div>
          )}

          {isError && (
            <p className="text-sm text-red-600 py-2">
              Error: {(error as Error)?.message ?? 'Run failed'}
            </p>
          )}

          {data && !isPending && (
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-content-secondary">Status</span>
                <Badge variant={data.status === 'SUCCEEDED' ? 'success' : 'neutral'}>
                  {data.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-0.5">
                  <span className="text-xs text-content-muted block">Est. Cost</span>
                  <span className="text-content-primary font-medium tabular-nums">
                    {formatCost(data.cost_estimate)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs text-content-muted block">Actual Cost</span>
                  <span className="text-content-primary font-medium tabular-nums">
                    {formatCost(data.cost_actual)}
                  </span>
                </div>
              </div>
              {data.outputs && (
                <div className="space-y-0.5">
                  <span className="text-xs text-content-muted block">Outputs</span>
                  <pre className="text-xs font-mono bg-slate-50 p-2 overflow-auto max-h-40">
                    {JSON.stringify(data.outputs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

GuardrailTestRunner.displayName = 'GuardrailTestRunner';

export default GuardrailTestRunner;
