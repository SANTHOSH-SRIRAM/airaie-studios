// ============================================================
// PreflightReport — Grouped preflight validation results
// ============================================================

import React, { useState } from 'react';
import {
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Wrench,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@airaie/ui';
import type { PreflightResult, PreflightCheck, PreflightBlocker, PreflightWarning } from '@/types/execution';
import { getFixSuggestion } from '@/constants/preflightFixMap';

export interface PreflightReportProps {
  result: PreflightResult;
  onAutoFix?: (checkName: string, fixAction: string) => void;
  onNavigateToInput?: (fieldKey: string) => void;
}

// --- Blocker card ---

function BlockerCard({
  blocker,
  onAutoFix,
  onNavigateToInput,
}: {
  blocker: PreflightBlocker;
  onAutoFix?: (checkName: string, fixAction: string) => void;
  onNavigateToInput?: (fieldKey: string) => void;
}) {
  const fix = getFixSuggestion(blocker.check_name);

  return (
    <div className="flex items-start gap-2 p-2.5 border border-red-200 bg-red-50/50">
      <XCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-red-800">{blocker.check_name}</div>
        <div className="text-[11px] text-red-700 mt-0.5">{blocker.message}</div>
        {blocker.auto_fix && onAutoFix && (
          <button
            type="button"
            onClick={() => onAutoFix(blocker.check_name, blocker.auto_fix!)}
            className="flex items-center gap-1 text-[10px] text-red-700 hover:text-red-900 mt-1.5 font-medium"
          >
            <Wrench size={10} />
            Auto-fix: {blocker.auto_fix}
          </button>
        )}
        {fix && (
          <div className="text-[10px] text-red-600 italic mt-1">
            {fix.suggestion}
          </div>
        )}
        {fix?.inputField && onNavigateToInput && (
          <button
            type="button"
            onClick={() => onNavigateToInput(fix.inputField!)}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1 font-medium"
          >
            <ArrowRight size={10} />
            Go to Inputs &gt; {fix.inputLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Warning card ---

function WarningCard({
  warning,
  onAutoFix,
  onNavigateToInput,
}: {
  warning: PreflightWarning;
  onAutoFix?: (checkName: string, fixAction: string) => void;
  onNavigateToInput?: (fieldKey: string) => void;
}) {
  const fix = getFixSuggestion(warning.check_name);

  return (
    <div className="flex items-start gap-2 p-2.5 border border-amber-200 bg-amber-50/50">
      <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-amber-800">{warning.check_name}</div>
        <div className="text-[11px] text-amber-700 mt-0.5">{warning.message}</div>
        {warning.suggestion && (
          <div className="text-[10px] text-amber-600 italic mt-1">
            Suggestion: {warning.suggestion}
          </div>
        )}
        {fix && !warning.suggestion && (
          <div className="text-[10px] text-amber-600 italic mt-1">
            {fix.suggestion}
          </div>
        )}
        {fix?.inputField && onNavigateToInput && (
          <button
            type="button"
            onClick={() => onNavigateToInput(fix.inputField!)}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1 font-medium"
          >
            <ArrowRight size={10} />
            Go to Inputs &gt; {fix.inputLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// --- Passed check row ---

function PassedRow({ check }: { check: PreflightCheck }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <CheckCircle2 size={13} className="text-green-600 shrink-0" />
      <span className="text-xs text-content-secondary flex-1">{check.name}</span>
      <span className="text-[10px] text-content-muted studio-mono">
        {check.duration_ms < 1 ? '<1ms' : `${check.duration_ms.toFixed(0)}ms`}
      </span>
    </div>
  );
}

// --- Main component ---

const PreflightReport: React.FC<PreflightReportProps> = ({ result, onAutoFix, onNavigateToInput }) => {
  const [passedExpanded, setPassedExpanded] = useState(false);

  const blockers = result.blockers ?? [];
  const warnings = result.warnings ?? [];
  const checks = result.checks ?? [];
  const passedChecks = checks.filter((c) => c.status === 'pass');
  const failedChecks = checks.filter((c) => c.status === 'fail');
  const warnChecks = checks.filter((c) => c.status === 'warn');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Preflight Validation
        </h3>
        <div className="flex items-center gap-2">
          <Badge
            variant={result.passed ? 'success' : 'danger'}
            className="text-[10px]"
          >
            {result.passed ? 'PASS' : 'FAIL'}
          </Badge>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 text-[11px]">
        {passedChecks.length > 0 && (
          <span className="text-green-700">
            {passedChecks.length} passed
          </span>
        )}
        {warnChecks.length > 0 && (
          <span className="text-amber-700">
            {warnChecks.length} warning{warnChecks.length !== 1 ? 's' : ''}
          </span>
        )}
        {failedChecks.length > 0 && (
          <span className="text-red-700">
            {failedChecks.length} failed
          </span>
        )}
        {blockers.length > 0 && (
          <span className="text-red-700 font-medium">
            {blockers.length} blocker{blockers.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-700 uppercase tracking-wider">
            <XCircle size={11} />
            Blockers ({blockers.length})
          </div>
          {blockers.map((b, i) => (
            <BlockerCard key={i} blocker={b} onAutoFix={onAutoFix} onNavigateToInput={onNavigateToInput} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
            <AlertTriangle size={11} />
            Warnings ({warnings.length})
          </div>
          {warnings.map((w, i) => (
            <WarningCard key={i} warning={w} onAutoFix={onAutoFix} onNavigateToInput={onNavigateToInput} />
          ))}
        </div>
      )}

      {/* Passed (collapsible) */}
      {passedChecks.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setPassedExpanded(!passedExpanded)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-green-700 uppercase tracking-wider hover:text-green-900"
          >
            {passedExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <CheckCircle2 size={11} />
            Passed ({passedChecks.length})
          </button>
          {passedExpanded && (
            <div className="mt-1.5 ml-4 space-y-0.5">
              {passedChecks.map((c, i) => (
                <PassedRow key={i} check={c} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Total time */}
      <div className="flex items-center gap-1.5 text-[10px] text-content-muted pt-1 border-t border-surface-border">
        <Clock size={10} />
        Total validation time: {result.total_ms}ms
      </div>
    </div>
  );
};

PreflightReport.displayName = 'PreflightReport';

export default PreflightReport;
