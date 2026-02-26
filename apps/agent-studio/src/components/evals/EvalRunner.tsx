import React from 'react';
import { cn, Button, Badge, Select, ProgressBar, Spinner } from '@airaie/ui';
import { Play } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useRunAgent } from '@hooks/useAgentRun';
import { useAgentVersions } from '@hooks/useAgents';

interface TestCase {
  id: string;
  name: string;
  input: Record<string, unknown>;
  criteria: {
    min_actions?: number;
    max_actions?: number;
    min_score?: number;
    max_cost?: number;
    required_tools?: string[];
    forbidden_tools?: string[];
  };
}

interface EvalResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  cost: number;
  actionCount: number;
  details: string;
}

export interface EvalRunnerProps {
  onResults: (results: EvalResult[]) => void;
  className?: string;
}

const storageKey = (agentId: string) => `airaie:evals:${agentId}`;

const evaluate = (tc: TestCase, res: { score: number; cost: number; actionCount: number; toolsUsed: string[] }): EvalResult => {
  const failures: string[] = [];
  const c = tc.criteria;
  if (c.min_actions != null && res.actionCount < c.min_actions) failures.push(`actions ${res.actionCount} < min ${c.min_actions}`);
  if (c.max_actions != null && res.actionCount > c.max_actions) failures.push(`actions ${res.actionCount} > max ${c.max_actions}`);
  if (c.min_score != null && res.score < c.min_score) failures.push(`score ${res.score} < min ${c.min_score}`);
  if (c.max_cost != null && res.cost > c.max_cost) failures.push(`cost ${res.cost} > max ${c.max_cost}`);
  if (c.required_tools?.length) {
    const missing = c.required_tools.filter((t) => !res.toolsUsed.includes(t));
    if (missing.length) failures.push(`missing tools: ${missing.join(', ')}`);
  }
  if (c.forbidden_tools?.length) {
    const used = c.forbidden_tools.filter((t) => res.toolsUsed.includes(t));
    if (used.length) failures.push(`forbidden tools used: ${used.join(', ')}`);
  }
  return { testCaseId: tc.id, passed: failures.length === 0, score: res.score, cost: res.cost, actionCount: res.actionCount, details: failures.length ? failures.join('; ') : 'All criteria met' };
};

const EvalRunner: React.FC<EvalRunnerProps> = ({ onResults, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: versions } = useAgentVersions(agentId);
  const runAgent = useRunAgent();

  const [version, setVersion] = React.useState('');
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState({ current: 0, total: 0 });
  const [results, setResults] = React.useState<EvalResult[]>([]);

  const versionOptions = [
    { value: '', label: 'Select version...' },
    ...(versions ?? []).map((v) => ({ value: String(v.version), label: `v${v.version}` })),
  ];

  const handleRun = async () => {
    let cases: TestCase[];
    try { cases = JSON.parse(localStorage.getItem(storageKey(agentId)) ?? '[]'); } catch { cases = []; }
    if (!cases.length || !version) return;

    setRunning(true);
    setProgress({ current: 0, total: cases.length });
    const collected: EvalResult[] = [];

    for (let i = 0; i < cases.length; i++) {
      const tc = cases[i];
      try {
        const res = await runAgent.mutateAsync({ agentId, version: Number(version), inputs: tc.input, dryRun: true });
        const outputs = (res.outputs ?? {}) as Record<string, unknown>;
        collected.push(evaluate(tc, {
          score: (outputs.score as number) ?? 0,
          cost: res.cost_actual ?? res.cost_estimate ?? 0,
          actionCount: ((outputs.actions as unknown[])?.length) ?? 0,
          toolsUsed: ((outputs.actions as Array<{ tool: string }>)?.map((a) => a.tool)) ?? [],
        }));
      } catch (err) {
        collected.push({ testCaseId: tc.id, passed: false, score: 0, cost: 0, actionCount: 0, details: `Error: ${(err as Error).message}` });
      }
      setProgress({ current: i + 1, total: cases.length });
    }

    setResults(collected);
    onResults(collected);
    setRunning(false);
  };

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Select options={versionOptions} value={version} onChange={(e) => setVersion(e.target.value)} className="w-44" />
        <Button variant="primary" size="sm" icon={Play} onClick={handleRun} disabled={running || !version}>
          {running ? 'Running...' : 'Run All Tests'}
        </Button>
        {running && <Spinner size="sm" />}
      </div>

      {running && progress.total > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-content-muted">{progress.current}/{progress.total} tests completed</span>
          <ProgressBar value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0} />
        </div>
      )}

      {results.length > 0 && (
        <>
          <table className="w-full text-sm border border-border-default">
            <thead>
              <tr className="bg-surface-secondary text-content-secondary text-xs uppercase tracking-wider">
                <th className="text-left px-3 py-2">Test</th>
                <th className="text-left px-3 py-2">Result</th>
                <th className="text-right px-3 py-2">Score</th>
                <th className="text-right px-3 py-2">Cost</th>
                <th className="text-right px-3 py-2">Actions</th>
                <th className="text-left px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                let cases: TestCase[];
                try { cases = JSON.parse(localStorage.getItem(storageKey(agentId)) ?? '[]'); } catch { cases = []; }
                const tc = cases.find((t) => t.id === r.testCaseId);
                return (
                  <tr key={r.testCaseId} className="border-t border-border-default">
                    <td className="px-3 py-2 font-medium text-content-primary">{tc?.name ?? r.testCaseId.slice(0, 8)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'PASS' : 'FAIL'}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.score.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">${r.cost.toFixed(4)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.actionCount}</td>
                    <td className="px-3 py-2 text-xs text-content-muted max-w-[240px] truncate">{r.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="text-sm text-content-secondary">
            Summary: <span className="font-medium text-content-primary">{passedCount}/{results.length}</span> passed
          </div>
        </>
      )}
    </div>
  );
};

EvalRunner.displayName = 'EvalRunner';

export default EvalRunner;
