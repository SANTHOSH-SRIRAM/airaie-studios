import React, { useState, useCallback } from 'react';
import { cn, Button, Badge, Spinner, Card, JsonViewer, formatCost } from '@airaie/ui';
import { FlaskConical, ArrowLeft, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useRunAgent } from '@hooks/useAgentRun';
import { useEvalCases } from '@hooks/useEvals';
import type { EvalCase } from '@hooks/useEvals';

interface RunResult {
  proposal: Record<string, unknown> | null;
  policyDecision: Record<string, unknown> | null;
  score: number;
  cost: number;
  actions: number;
  passed: boolean;
  error?: string;
}

interface VersionStats {
  passCount: number;
  totalCount: number;
  avgScore: number;
  avgCost: number;
  totalActions: number;
  results: RunResult[];
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
  const { data: evalCases } = useEvalCases(agentId);
  const [running, setRunning] = useState(false);
  const [statsA, setStatsA] = useState<VersionStats | null>(null);
  const [statsB, setStatsB] = useState<VersionStats | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedCase, setExpandedCase] = useState<number | null>(null);

  const extractFromRun = (res: Record<string, unknown>, criteria: EvalCase['criteria']): RunResult => {
    const outputs = (res.outputs ?? res) as Record<string, unknown>;
    const proposal = (outputs.proposal ?? {}) as Record<string, unknown>;
    const pd = (outputs.policy_decision ?? {}) as Record<string, unknown>;
    const actions = ((proposal.actions as unknown[])?.length) ?? 0;
    const score = (proposal.total_score as number) ?? (outputs.score as number) ?? 0;
    const cost = (res.cost_actual as number) ?? (res.cost_estimate as number) ?? (proposal.estimated_cost as number) ?? 0;

    let passed = true;
    if (criteria.min_actions !== undefined && actions < criteria.min_actions) passed = false;
    if (criteria.max_actions !== undefined && actions > criteria.max_actions) passed = false;
    if (criteria.min_score !== undefined && score < criteria.min_score) passed = false;
    if (criteria.max_cost !== undefined && cost > criteria.max_cost) passed = false;

    return { proposal, policyDecision: pd, score, cost, actions, passed };
  };

  const runEval = useCallback(async () => {
    const cases = evalCases ?? [];
    if (cases.length === 0) return;

    setRunning(true);
    setProgress({ current: 0, total: cases.length * 2 });

    const resultsA: RunResult[] = [];
    const resultsB: RunResult[] = [];
    let step = 0;

    for (const tc of cases) {
      // Version A
      try {
        const res = await runAgent.mutateAsync({ agentId, version: versionA, inputs: tc.inputs, dryRun: true });
        resultsA.push(extractFromRun(res as unknown as Record<string, unknown>, tc.criteria));
      } catch (err) {
        resultsA.push({ proposal: null, policyDecision: null, score: 0, cost: 0, actions: 0, passed: false, error: (err as Error)?.message });
      }
      setProgress({ current: ++step, total: cases.length * 2 });

      // Version B
      try {
        const res = await runAgent.mutateAsync({ agentId, version: versionB, inputs: tc.inputs, dryRun: true });
        resultsB.push(extractFromRun(res as unknown as Record<string, unknown>, tc.criteria));
      } catch (err) {
        resultsB.push({ proposal: null, policyDecision: null, score: 0, cost: 0, actions: 0, passed: false, error: (err as Error)?.message });
      }
      setProgress({ current: ++step, total: cases.length * 2 });
    }

    const aggregate = (results: RunResult[]): VersionStats => ({
      passCount: results.filter(r => r.passed).length,
      totalCount: results.length,
      avgScore: results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0,
      avgCost: results.length > 0 ? results.reduce((s, r) => s + r.cost, 0) / results.length : 0,
      totalActions: results.reduce((s, r) => s + r.actions, 0),
      results,
    });

    setStatsA(aggregate(resultsA));
    setStatsB(aggregate(resultsB));
    setRunning(false);
  }, [agentId, versionA, versionB, runAgent, evalCases]);

  const cases = evalCases ?? [];
  const winnerLabel = statsA && statsB
    ? statsA.passCount > statsB.passCount ? `v${versionA}` : statsB.passCount > statsA.passCount ? `v${versionB}` : 'Tie'
    : null;

  const MetricRow = ({ label, valA, valB, format, higherBetter = true }: { label: string; valA: number; valB: number; format: (v: number) => string; higherBetter?: boolean }) => {
    const aWins = higherBetter ? valA > valB : valA < valB;
    const bWins = higherBetter ? valB > valA : valB < valA;
    return (
      <div className="flex items-center text-sm py-1.5">
        <span className="w-28 text-content-tertiary text-xs">{label}</span>
        <span className={cn('flex-1 font-mono text-right', aWins && 'text-emerald-600 font-semibold')}>{format(valA)}</span>
        <span className="w-8 text-center text-content-muted text-xs">vs</span>
        <span className={cn('flex-1 font-mono', bWins && 'text-emerald-600 font-semibold')}>{format(valB)}</span>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white">
        <button onClick={onBack} className="text-content-muted hover:text-content-primary"><ArrowLeft size={16} /></button>
        <h3 className="text-sm font-semibold text-content-primary">A/B Eval: v{versionA} vs v{versionB}</h3>
        {winnerLabel && (
          <Badge variant="success" badgeStyle="outline" className="ml-2">
            <Trophy size={10} className="mr-1" /> Winner: {winnerLabel}
          </Badge>
        )}
        <Button variant="primary" size="sm" icon={FlaskConical} onClick={runEval} loading={running} className="ml-auto"
          disabled={cases.length === 0}>
          {running ? `${progress.current}/${progress.total}` : `Run A/B (${cases.length} cases)`}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {cases.length === 0 && (
          <div className="text-center py-12 text-sm text-content-muted">
            No test cases. Add golden datasets in the Evals tab first.
          </div>
        )}

        {/* Aggregate comparison */}
        {statsA && statsB && (
          <Card>
            <Card.Body>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-content-tertiary pb-2 border-b border-surface-border">
                <span className="w-28">Metric</span>
                <span className="flex-1 text-right">v{versionA}</span>
                <span className="w-8" />
                <span className="flex-1">v{versionB}</span>
              </div>
              <MetricRow label="Pass Rate" valA={statsA.passCount / statsA.totalCount} valB={statsB.passCount / statsB.totalCount}
                format={v => `${(v * 100).toFixed(0)}%`} />
              <MetricRow label="Avg Score" valA={statsA.avgScore} valB={statsB.avgScore} format={v => v.toFixed(3)} />
              <MetricRow label="Avg Cost" valA={statsA.avgCost} valB={statsB.avgCost} format={v => formatCost(v)} higherBetter={false} />
              <MetricRow label="Total Actions" valA={statsA.totalActions} valB={statsB.totalActions} format={v => String(v)} />
            </Card.Body>
          </Card>
        )}

        {/* Per-case comparison */}
        {statsA && statsB && cases.map((tc, i) => {
          const rA = statsA.results[i];
          const rB = statsB.results[i];
          if (!rA || !rB) return null;
          const isExpanded = expandedCase === i;

          return (
            <Card key={tc.id}>
              <button
                onClick={() => setExpandedCase(isExpanded ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-bg transition-colors"
              >
                <span className="text-sm font-medium text-content-primary flex-1">{tc.name}</span>
                <div className="flex items-center gap-2">
                  {rA.passed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                  <span className="text-xs text-content-muted">v{versionA}</span>
                </div>
                <div className="flex items-center gap-2">
                  {rB.passed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-400" />}
                  <span className="text-xs text-content-muted">v{versionB}</span>
                </div>
              </button>
              {isExpanded && (
                <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-content-muted uppercase tracking-wider">v{versionA} Proposal</span>
                    {rA.error ? <p className="text-xs text-red-600">{rA.error}</p>
                      : rA.proposal && <JsonViewer data={rA.proposal} defaultExpandDepth={1} />}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-content-muted uppercase tracking-wider">v{versionB} Proposal</span>
                    {rB.error ? <p className="text-xs text-red-600">{rB.error}</p>
                      : rB.proposal && <JsonViewer data={rB.proposal} defaultExpandDepth={1} />}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

ABEvalPanel.displayName = 'ABEvalPanel';
export default ABEvalPanel;
