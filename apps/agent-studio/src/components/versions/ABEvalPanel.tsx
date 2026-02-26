import React, { useState, useCallback } from 'react';
import { cn, Button, Badge, Spinner } from '@airaie/ui';
import { FlaskConical, ArrowLeft } from 'lucide-react';
import { formatCost } from '@airaie/ui';
import { useUIStore } from '@store/uiStore';
import { useRunAgent } from '@hooks/useAgentRun';

interface TestCase {
  id: string;
  name: string;
  input: Record<string, unknown>;
  criteria: {
    minActions?: number;
    maxActions?: number;
    minScore?: number;
    maxCost?: number;
  };
}

interface VersionResult {
  passCount: number;
  totalCount: number;
  avgScore: number;
  avgCost: number;
  totalActions: number;
}

export interface ABEvalPanelProps {
  versionA: number;
  versionB: number;
  onBack: () => void;
  className?: string;
}

const ABEvalPanel: React.FC<ABEvalPanelProps> = ({ versionA, versionB, onBack, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const runAgent = useRunAgent();
  const [running, setRunning] = useState(false);
  const [resultA, setResultA] = useState<VersionResult | null>(null);
  const [resultB, setResultB] = useState<VersionResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const loadTestCases = (): TestCase[] => {
    try {
      const raw = localStorage.getItem(`airaie:evals:${agentId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const extractMetrics = (run: { outputs?: Record<string, unknown>; cost_actual: number; cost_estimate: number }) => {
    const outputs = (run.outputs ?? {}) as Record<string, unknown>;
    return {
      score: (outputs.score as number) ?? 0,
      cost: run.cost_actual ?? run.cost_estimate ?? 0,
      actions: ((outputs.actions as unknown[])?.length) ?? 0,
    };
  };

  const evaluate = (run: { outputs?: Record<string, unknown>; cost_actual: number; cost_estimate: number }, criteria: TestCase['criteria']): boolean => {
    const m = extractMetrics(run);
    if (criteria.minActions !== undefined && m.actions < criteria.minActions) return false;
    if (criteria.maxActions !== undefined && m.actions > criteria.maxActions) return false;
    if (criteria.minScore !== undefined && m.score < criteria.minScore) return false;
    if (criteria.maxCost !== undefined && m.cost > criteria.maxCost) return false;
    return true;
  };

  const runEval = useCallback(async () => {
    const cases = loadTestCases();
    if (cases.length === 0) return;

    setRunning(true);
    setProgress({ current: 0, total: cases.length * 2 });
    const statsA: VersionResult = { passCount: 0, totalCount: cases.length, avgScore: 0, avgCost: 0, totalActions: 0 };
    const statsB: VersionResult = { passCount: 0, totalCount: cases.length, avgScore: 0, avgCost: 0, totalActions: 0 };

    let scoresSumA = 0, costsSumA = 0, scoresSumB = 0, costsSumB = 0;
    let step = 0;

    for (const tc of cases) {
      try {
        const resA = await runAgent.mutateAsync({ agentId, version: versionA, inputs: tc.input, dryRun: true });
        const passed = evaluate(resA, tc.criteria);
        if (passed) statsA.passCount++;
        const mA = extractMetrics(resA);
        scoresSumA += mA.score;
        costsSumA += mA.cost;
        statsA.totalActions += mA.actions;
      } catch { /* count as fail */ }
      setProgress({ current: ++step, total: cases.length * 2 });

      try {
        const resB = await runAgent.mutateAsync({ agentId, version: versionB, inputs: tc.input, dryRun: true });
        const passed = evaluate(resB, tc.criteria);
        if (passed) statsB.passCount++;
        const mB = extractMetrics(resB);
        scoresSumB += mB.score;
        costsSumB += mB.cost;
        statsB.totalActions += mB.actions;
      } catch { /* count as fail */ }
      setProgress({ current: ++step, total: cases.length * 2 });
    }

    statsA.avgScore = cases.length > 0 ? scoresSumA / cases.length : 0;
    statsA.avgCost = cases.length > 0 ? costsSumA / cases.length : 0;
    statsB.avgScore = cases.length > 0 ? scoresSumB / cases.length : 0;
    statsB.avgCost = cases.length > 0 ? costsSumB / cases.length : 0;

    setResultA(statsA);
    setResultB(statsB);
    setRunning(false);
  }, [agentId, versionA, versionB, runAgent]);

  const renderMetrics = (label: string, result: VersionResult | null) => (
    <div className="flex-1 border border-surface-border bg-white p-4 space-y-3">
      <div className="text-sm font-medium text-content-primary">{label}</div>
      {result ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-content-tertiary">Pass Rate</span><span className="font-medium">{((result.passCount / result.totalCount) * 100).toFixed(0)}%</span></div>
          <div className="flex justify-between"><span className="text-content-tertiary">Avg Score</span><span className="font-mono">{result.avgScore.toFixed(3)}</span></div>
          <div className="flex justify-between"><span className="text-content-tertiary">Avg Cost</span><span className="font-mono">{formatCost(result.avgCost)}</span></div>
          <div className="flex justify-between"><span className="text-content-tertiary">Total Actions</span><span className="font-mono">{result.totalActions}</span></div>
          <div className="h-2 bg-surface-hover"><div className="h-full bg-brand-secondary" style={{ width: `${(result.passCount / result.totalCount) * 100}%` }} /></div>
        </div>
      ) : (
        <span className="text-xs text-content-muted">Run eval to see metrics</span>
      )}
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white">
        <button onClick={onBack} className="text-content-muted hover:text-content-primary"><ArrowLeft size={16} /></button>
        <h3 className="text-sm font-semibold text-content-primary">A/B Eval: v{versionA} vs v{versionB}</h3>
        <Button variant="primary" size="sm" icon={FlaskConical} onClick={runEval} loading={running} className="ml-auto">
          {running ? `Running ${progress.current}/${progress.total}` : 'Run A/B Eval'}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-4">
          {renderMetrics(`Version ${versionA}`, resultA)}
          {renderMetrics(`Version ${versionB}`, resultB)}
        </div>
      </div>
    </div>
  );
};

ABEvalPanel.displayName = 'ABEvalPanel';
export default ABEvalPanel;
