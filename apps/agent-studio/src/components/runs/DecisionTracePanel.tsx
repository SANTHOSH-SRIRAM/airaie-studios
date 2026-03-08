import React, { useState } from 'react';
import { cn, Badge, JsonViewer } from '@airaie/ui';
import { ChevronRight, ChevronDown, Brain, Search, ShieldCheck, FileText, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import type { KernelAuditEvent } from '@airaie/shared';

type Verbosity = 'minimal' | 'normal' | 'verbose';

export interface DecisionTracePanelProps {
  events: KernelAuditEvent[];
  className?: string;
  verbosity?: Verbosity;
  onVerbosityChange?: (v: Verbosity) => void;
}

// Maps event types to reasoning phases
const PHASE_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  AGENT_THINK: { label: 'Think', icon: Brain, color: 'text-purple-500' },
  TOOL_SELECT: { label: 'Select', icon: Search, color: 'text-blue-500' },
  POLICY_EVAL: { label: 'Validate', icon: ShieldCheck, color: 'text-amber-500' },
  PROPOSAL_CREATE: { label: 'Propose', icon: FileText, color: 'text-emerald-500' },
  EXPLAIN: { label: 'Explain', icon: MessageSquare, color: 'text-slate-500' },
};

function getPhase(eventType: string) {
  for (const [key, val] of Object.entries(PHASE_MAP)) {
    if (eventType.includes(key)) return val;
  }
  return { label: eventType, icon: Brain, color: 'text-content-muted' };
}

function TraceStep({ event, isLast }: { event: KernelAuditEvent; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const phase = getPhase(event.event_type);
  const Icon = phase.icon;
  const payload = event.payload ?? {};

  // Extract tool candidates if present
  const toolCandidates = payload.candidates as Array<{ tool_ref: string; score: number; selected?: boolean }> | undefined;
  // Extract policy checks if present
  const policyChecks = payload.checks as Array<{ name: string; passed: boolean; message?: string }> | undefined;

  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 border', phase.color, 'border-current bg-white')}>
          <Icon size={14} />
        </div>
        {!isLast && <div className="w-px flex-1 bg-surface-border min-h-[16px]" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left group"
        >
          {expanded ? <ChevronDown size={14} className="text-content-muted" /> : <ChevronRight size={14} className="text-content-muted" />}
          <Badge variant={phase.label === 'Validate' ? 'warning' : phase.label === 'Propose' ? 'success' : 'info'} badgeStyle="outline">
            {phase.label}
          </Badge>
          <span className="text-xs text-content-secondary group-hover:text-content-primary transition-colors truncate">
            {payload.summary as string ?? event.event_type}
          </span>
          <span className="ml-auto text-[10px] text-content-muted tabular-nums shrink-0">
            {new Date(event.created_at).toLocaleTimeString()}
          </span>
        </button>

        {expanded && (
          <div className="mt-2 ml-5 space-y-3">
            {/* Tool candidates table */}
            {toolCandidates && toolCandidates.length > 0 && (
              <div className="border border-surface-border rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-bg text-content-tertiary">
                      <th className="text-left px-3 py-1.5 font-medium">Tool</th>
                      <th className="text-right px-3 py-1.5 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toolCandidates.map((c) => (
                      <tr key={c.tool_ref} className={cn('border-t border-surface-border', c.selected && 'bg-emerald-50')}>
                        <td className="px-3 py-1.5 font-mono">
                          {c.selected && <CheckCircle2 size={12} className="inline text-emerald-500 mr-1 -mt-0.5" />}
                          {c.tool_ref}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{c.score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Policy checks */}
            {policyChecks && policyChecks.length > 0 && (
              <div className="space-y-1">
                {policyChecks.map((check, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {check.passed
                      ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      : <XCircle size={13} className="text-red-500 shrink-0" />}
                    <span className={cn('font-medium', check.passed ? 'text-content-primary' : 'text-red-600')}>
                      {check.name}
                    </span>
                    {check.message && <span className="text-content-muted">— {check.message}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Raw payload */}
            <JsonViewer data={payload} defaultExpandDepth={1} />
          </div>
        )}
      </div>
    </div>
  );
}

const VERBOSITY_OPTIONS: Verbosity[] = ['minimal', 'normal', 'verbose'];

const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({ events, className, verbosity = 'normal', onVerbosityChange }) => {
  if (events.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-8 text-sm text-content-muted', className)}>
        No decision trace available for this run.
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {onVerbosityChange && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-content-muted mr-2">Detail:</span>
          {VERBOSITY_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onVerbosityChange(v)}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                v === verbosity
                  ? 'bg-brand-secondary text-white'
                  : 'bg-surface-bg text-content-secondary hover:text-content-primary'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-0">
        {events.map((event, i) => (
          <TraceStep key={event.id} event={event} isLast={i === events.length - 1} />
        ))}
      </div>
    </div>
  );
};

DecisionTracePanel.displayName = 'DecisionTracePanel';

export default DecisionTracePanel;
