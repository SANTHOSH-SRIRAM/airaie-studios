import React from 'react';
import { cn, EmptyState, formatCost } from '@airaie/ui';
import { BarChart3 } from 'lucide-react';

interface EvalResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  cost: number;
  actionCount: number;
  details: string;
}

export interface AccuracyScoringProps {
  results: EvalResult[];
  className?: string;
}

const AccuracyScoring: React.FC<AccuracyScoringProps> = ({ results, className }) => {
  if (results.length === 0) {
    return (
      <div className={cn('py-12', className)}>
        <EmptyState icon={BarChart3} heading="No results yet" description="Run evaluations to see accuracy scoring." />
      </div>
    );
  }

  const passRate = (results.filter((r) => r.passed).length / results.length) * 100;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgCost = results.reduce((sum, r) => sum + r.cost, 0) / results.length;

  const rateColor = passRate > 80 ? 'text-status-success' : passRate > 50 ? 'text-status-warning' : 'text-status-danger';

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-border-default p-4 space-y-1">
          <span className="text-xs text-content-muted uppercase tracking-wider">Pass Rate</span>
          <p className={cn('text-2xl font-semibold tabular-nums', rateColor)}>{passRate.toFixed(1)}%</p>
        </div>
        <div className="border border-border-default p-4 space-y-1">
          <span className="text-xs text-content-muted uppercase tracking-wider">Avg Score</span>
          <p className="text-2xl font-semibold tabular-nums text-content-primary">{avgScore.toFixed(2)}</p>
        </div>
        <div className="border border-border-default p-4 space-y-1">
          <span className="text-xs text-content-muted uppercase tracking-wider">Avg Cost</span>
          <p className="text-2xl font-semibold tabular-nums text-content-primary">{formatCost(avgCost)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Score per Test Case</span>
        <div className="space-y-1.5">
          {results.map((r) => (
            <div key={r.testCaseId} className="flex items-center gap-3">
              <span className="text-xs text-content-muted w-20 truncate tabular-nums">{r.testCaseId.slice(0, 8)}</span>
              <div className="flex-1 h-5 bg-slate-100 relative">
                <div
                  className={cn('h-full transition-all', r.passed ? 'bg-status-success' : 'bg-status-danger')}
                  style={{ width: `${Math.min(r.score * 100, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-content-primary">
                  {r.score.toFixed(2)}
                </span>
              </div>
              <span className="text-xs w-10 text-right">
                {r.passed ? (
                  <span className="text-status-success">Pass</span>
                ) : (
                  <span className="text-status-danger">Fail</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

AccuracyScoring.displayName = 'AccuracyScoring';

export default AccuracyScoring;
