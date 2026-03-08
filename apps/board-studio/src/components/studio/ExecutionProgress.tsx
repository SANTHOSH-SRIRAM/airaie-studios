// ============================================================
// ExecutionProgress — Per-step execution monitoring
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  SkipForward,
  Square,
} from 'lucide-react';
import { Button } from '@airaie/ui';
import type { PlanStep } from '@/types/board';
import type { PlanResponse } from '@api/plans';
import { ShimmerBar } from './ExecutionAnimations';

export interface ExecutionProgressProps {
  plan: PlanResponse;
  onStop?: () => void;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={14} className="text-green-600 shrink-0" />;
    case 'running':
      return <Loader2 size={14} className="text-blue-500 animate-spin shrink-0" />;
    case 'failed':
      return <XCircle size={14} className="text-red-500 shrink-0" />;
    case 'skipped':
      return <SkipForward size={14} className="text-slate-400 shrink-0" />;
    default:
      return <Circle size={14} className="text-slate-300 shrink-0" />;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = Math.floor(seconds % 60);
  if (minutes < 60) return `${minutes}m ${remainSec}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function useElapsedTimer(running: boolean): number {
  const startRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - startRef.current), 1000);
    return () => clearInterval(id);
  }, [running]);

  return elapsed;
}

const ExecutionProgress: React.FC<ExecutionProgressProps> = ({ plan, onStop }) => {
  const isExecuting = plan.status === 'executing';
  const elapsed = useElapsedTimer(isExecuting);
  const steps = plan.steps ?? [];
  const completed = steps.filter((s) => s.status === 'completed').length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ETA
  let eta: string | null = null;
  if (isExecuting && pct > 0 && pct < 100) {
    const remaining = (elapsed / pct) * (100 - pct);
    eta = remaining < 1000 ? 'Almost done' : formatDuration(remaining);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Execution Progress
        </h3>
        {eta && <span className="text-[11px] text-content-muted">ETA: {eta}</span>}
      </div>

      {/* Overall bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-content-muted studio-mono">{completed}/{total} steps</span>
          <span className="text-xs font-medium text-content-primary studio-mono">{pct}%</span>
        </div>
        <div className="h-2.5 bg-surface-bg border border-surface-border relative overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              plan.status === 'failed' ? 'bg-red-500' :
              plan.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
          {isExecuting && <ShimmerBar />}
        </div>
      </div>

      {/* Step list */}
      <div className="border border-surface-border divide-y divide-surface-border max-h-64 overflow-y-auto">
        {steps.map((step) => {
          const isActive = step.status === 'running';
          return (
            <div
              key={step.id}
              ref={isActive ? activeRef : undefined}
              className={`flex items-start gap-3 py-2 px-3 ${isActive ? 'bg-blue-50/50' : ''}`}
            >
              <StatusIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-medium truncate block ${
                  step.status === 'failed' ? 'text-red-700' :
                  isActive ? 'text-content-primary' : 'text-content-secondary'
                }`}>
                  {step.tool_name}
                </span>
                <span className="text-[10px] text-content-muted">{step.role}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-surface-border">
        <div className="flex items-center gap-4 text-[11px] text-content-muted">
          {isExecuting && <span>Elapsed: {formatDuration(elapsed)}</span>}
          {plan.cost_estimate && <span>Est. cost: ~{plan.cost_estimate}</span>}
        </div>
        {isExecuting && onStop && (
          <Button variant="outline" size="sm" icon={Square} onClick={onStop}>
            Stop
          </Button>
        )}
      </div>
    </div>
  );
};

ExecutionProgress.displayName = 'ExecutionProgress';

export default ExecutionProgress;
