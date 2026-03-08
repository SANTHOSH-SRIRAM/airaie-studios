import React, { useState } from 'react';
import { cn, Button, Badge, CodeEditor, Spinner, Card, JsonViewer, formatCost } from '@airaie/ui';
import { Play, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useRunAgent } from '@hooks/useAgentRun';

interface Scenario {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, unknown>;
  expectVerdict: 'approved' | 'needs_approval' | 'blocked';
}

/** Generate scenarios from agent context_schema when available. */
function generateScenariosFromSchema(schema?: Record<string, unknown>): Scenario[] {
  if (!schema || !schema.properties) return [];
  const props = schema.properties as Record<string, { type?: string; enum?: string[]; default?: unknown }>;
  const validInputs: Record<string, unknown> = {};
  const invalidInputs: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(props)) {
    if (prop.enum && prop.enum.length > 0) {
      validInputs[key] = prop.enum[0];
      invalidInputs[key] = 'INVALID_VALUE';
    } else if (prop.default !== undefined) {
      validInputs[key] = prop.default;
      invalidInputs[key] = prop.type === 'number' ? -999 : 'INVALID_VALUE';
    } else if (prop.type === 'string') {
      validInputs[key] = `test_${key}`;
      invalidInputs[key] = '';
    } else if (prop.type === 'number' || prop.type === 'integer') {
      validInputs[key] = 1;
      invalidInputs[key] = -999;
    }
  }

  return [
    { id: 'schema_valid', name: 'Valid schema inputs', description: 'Auto-generated valid inputs from context_schema', inputs: validInputs, expectVerdict: 'approved' },
    { id: 'schema_invalid', name: 'Invalid schema inputs', description: 'Auto-generated invalid inputs from context_schema', inputs: invalidInputs, expectVerdict: 'blocked' },
  ];
}

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'high_confidence',
    name: 'High-confidence proposal',
    description: 'Standard inputs that should auto-approve (score above threshold)',
    inputs: { geometry_id: 'geom_cube_001', material: 'steel_304' },
    expectVerdict: 'approved',
  },
  {
    id: 'high_cost',
    name: 'High-cost proposal',
    description: 'Inputs that produce expensive tool chain (should trigger cost gate)',
    inputs: { geometry_id: 'geom_complex_999', material: 'titanium_ti6al4v', mesh_levels: 5, max_iterations: 10 },
    expectVerdict: 'needs_approval',
  },
  {
    id: 'write_permission',
    name: 'Write-permission action',
    description: 'Tool requiring write permission (should trigger side-effect gate)',
    inputs: { geometry_id: 'geom_cube_001', material: 'steel_304', output_mode: 'write_to_disk' },
    expectVerdict: 'needs_approval',
  },
  {
    id: 'low_confidence',
    name: 'Low-confidence proposal',
    description: 'Unusual inputs that produce low scoring (should be blocked or escalated)',
    inputs: { geometry_id: 'unknown_geometry', material: 'unobtainium' },
    expectVerdict: 'blocked',
  },
];

interface ScenarioResult {
  scenarioId: string;
  verdict: string;
  passed: boolean;
  proposal?: Record<string, unknown>;
  policyDecision?: Record<string, unknown>;
  error?: string;
}

const VERDICT_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  approved: 'success',
  needs_approval: 'warning',
  blocked: 'danger',
};

const GuardrailTestRunner: React.FC<{ className?: string; contextSchema?: Record<string, unknown> }> = ({ className, contextSchema }) => {
  const agentId = useUIStore((s) => s.agentId);
  const schemaScenarios = React.useMemo(() => generateScenariosFromSchema(contextSchema), [contextSchema]);
  const scenarios = schemaScenarios.length > 0 ? [...schemaScenarios, ...DEFAULT_SCENARIOS] : DEFAULT_SCENARIOS;
  const runAgent = useRunAgent();
  const [version, setVersion] = useState(1);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customJson, setCustomJson] = useState('{}');
  const [customExpect, setCustomExpect] = useState<'approved' | 'needs_approval' | 'blocked'>('approved');

  const runScenarios = async (scenarios: Scenario[]) => {
    setRunning(true);
    const newResults: ScenarioResult[] = [];

    for (const s of scenarios) {
      try {
        const res = await runAgent.mutateAsync({ agentId, version, inputs: s.inputs, dryRun: true });
        const outputs = (res.outputs ?? {}) as Record<string, unknown>;
        const proposal = (outputs.proposal ?? outputs) as Record<string, unknown>;
        const pd = (outputs.policy_decision ?? (res as unknown as Record<string, unknown>).policy_decision ?? {}) as Record<string, unknown>;
        const verdict = ((pd.overall_verdict as string) ?? 'approved').toLowerCase();
        newResults.push({
          scenarioId: s.id,
          verdict,
          passed: verdict === s.expectVerdict,
          proposal,
          policyDecision: pd,
        });
      } catch (err) {
        newResults.push({
          scenarioId: s.id,
          verdict: 'error',
          passed: false,
          error: (err as Error)?.message ?? 'Run failed',
        });
      }
    }

    setResults(newResults);
    setRunning(false);
  };

  const handleRunAll = () => runScenarios(scenarios);

  const handleRunCustom = () => {
    let inputs: Record<string, unknown>;
    try { inputs = JSON.parse(customJson); } catch { return; }
    runScenarios([{ id: 'custom', name: 'Custom scenario', description: 'User-defined test', inputs, expectVerdict: customExpect }]);
  };

  const passCount = results.filter(r => r.passed).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <Card.Body className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-content-primary">Guardrail Test Runner</h3>
              <p className="text-xs text-content-secondary mt-0.5">Run policy scenarios via dry-run to verify guardrails work correctly.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <label className="text-[10px] text-content-muted uppercase tracking-wider block">Version</label>
                <input
                  type="number" min={1} value={version}
                  onChange={(e) => setVersion(Number(e.target.value))}
                  className="w-16 border border-surface-border bg-white px-2 py-1 text-sm font-mono"
                />
              </div>
              <Button variant="primary" size="sm" icon={Play} onClick={handleRunAll} loading={running} disabled={!agentId}>
                Run All ({scenarios.length})
              </Button>
            </div>
          </div>

          {/* Results summary */}
          {results.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t border-surface-border">
              <span className="text-sm font-medium">{passCount}/{results.length} passed</span>
              <div className="flex-1 h-2 bg-surface-hover rounded overflow-hidden">
                <div
                  className={cn('h-full transition-all', passCount === results.length ? 'bg-emerald-500' : 'bg-amber-500')}
                  style={{ width: `${(passCount / results.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Scenario results */}
      {results.length > 0 && (
        <Card>
          <div className="divide-y divide-surface-border">
            {scenarios.map((s) => {
              const r = results.find(res => res.scenarioId === s.id);
              if (!r) return null;
              const isExpanded = expandedId === s.id;
              return (
                <div key={s.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-bg transition-colors"
                  >
                    {r.passed
                      ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      : <XCircle size={16} className="text-red-500 shrink-0" />}
                    <span className="text-sm font-medium text-content-primary flex-1">{s.name}</span>
                    <Badge variant={VERDICT_BADGE[r.verdict] ?? 'neutral'} badgeStyle="outline">{r.verdict}</Badge>
                    <span className="text-xs text-content-muted">expect: {s.expectVerdict}</span>
                    {isExpanded ? <ChevronDown size={14} className="text-content-muted" /> : <ChevronRight size={14} className="text-content-muted" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 ml-7 space-y-2">
                      <p className="text-xs text-content-secondary">{s.description}</p>
                      {r.error && <p className="text-xs text-red-600">Error: {r.error}</p>}
                      {r.policyDecision && Object.keys(r.policyDecision).length > 0 && (
                        <div>
                          <span className="text-[10px] text-content-muted uppercase tracking-wider block mb-1">Policy Decision</span>
                          <JsonViewer data={r.policyDecision} defaultExpandDepth={2} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Custom scenario */}
      <Card>
        <Card.Body className="space-y-3">
          <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">Custom Scenario</h4>
          <CodeEditor value={customJson} onChange={setCustomJson} language="json" className="min-h-[100px]" />
          <div className="flex items-center gap-3">
            <select
              value={customExpect}
              onChange={(e) => setCustomExpect(e.target.value as typeof customExpect)}
              className="border border-surface-border bg-white px-2 py-1.5 text-xs"
            >
              <option value="approved">Expect: approved</option>
              <option value="needs_approval">Expect: needs_approval</option>
              <option value="blocked">Expect: blocked</option>
            </select>
            <Button variant="outline" size="sm" icon={Play} onClick={handleRunCustom} disabled={running || !agentId}>
              Run Custom
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

GuardrailTestRunner.displayName = 'GuardrailTestRunner';
export default GuardrailTestRunner;
