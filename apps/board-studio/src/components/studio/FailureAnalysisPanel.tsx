// ============================================================
// FailureAnalysisPanel — failure diagnosis with suggestions
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  XCircle,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  Pencil,
  TrendingDown,
} from 'lucide-react';
import { Badge, Button, Spinner } from '@airaie/ui';
import type { Card } from '@/types/board';
import type { IntentCardConfig } from '@/types/vertical-registry';
import type { CardEvidence } from '@api/cards';

// ─── Types ──────────────────────────────────────────────────

interface FailedCriterion {
  ev: CardEvidence;
  overshootAbs: number;
  overshootPct: number | null;
  direction: string; // "above" or "below" target
}

interface Suggestion {
  title: string;
  impact: string;
  severity: 'minor' | 'moderate' | 'major';
}

export interface FailureAnalysisPanelProps {
  card: Card;
  evidence: CardEvidence[];
  previousEvidence?: CardEvidence[];
  intentConfig?: IntentCardConfig | null;
  /** Compact mode for inspector sidebar */
  compact?: boolean;
  onEditConfig?: () => void;
  onRerun?: () => void;
}

// ─── Analysis engine ────────────────────────────────────────

function analyzeFailures(evidence: CardEvidence[]): FailedCriterion[] {
  return evidence
    .filter((ev) => !ev.passed)
    .map((ev) => {
      const diff = ev.value - ev.threshold;
      const op = ev.operator;
      // For lte/lt: value is too high → overshoot = value - threshold
      // For gte/gt: value is too low → overshoot = threshold - value
      const overshootAbs =
        op === 'lte' || op === 'lt' ? diff : op === 'gte' || op === 'gt' ? -diff : Math.abs(diff);
      const overshootPct = ev.threshold !== 0 ? (overshootAbs / Math.abs(ev.threshold)) * 100 : null;
      const direction =
        op === 'lte' || op === 'lt' ? 'above' : op === 'gte' || op === 'gt' ? 'below' : 'off';

      return { ev, overshootAbs, overshootPct, direction };
    })
    .sort((a, b) => Math.abs(b.overshootAbs) - Math.abs(a.overshootAbs));
}

function generateSuggestions(
  failures: FailedCriterion[],
  card: Card,
  previousEvidence: CardEvidence[] | undefined,
  intentConfig: IntentCardConfig | null | undefined
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // 1. Check if previous run was passing → suggest reverting
  if (previousEvidence) {
    const prevMap = new Map(previousEvidence.map((e) => [e.criterion, e]));
    const regressions = failures.filter((f) => {
      const prev = prevMap.get(f.ev.criterion);
      return prev && prev.passed;
    });
    if (regressions.length > 0) {
      suggestions.push({
        title: `Revert recent config changes (${regressions.length} metric${regressions.length > 1 ? 's' : ''} regressed)`,
        impact: 'Restore previously-passing configuration',
        severity: 'moderate',
      });
    }
  }

  // 2. Based on overshoot magnitude
  for (const f of failures) {
    const pct = f.overshootPct;
    if (pct != null && pct < 20) {
      suggestions.push({
        title: `Fine-tune ${f.ev.criterion} (off by ${pct.toFixed(1)}%)`,
        impact: 'Small parameter adjustment may suffice',
        severity: 'minor',
      });
    } else if (pct != null && pct >= 50) {
      suggestions.push({
        title: `Re-evaluate approach for ${f.ev.criterion} (off by ${pct.toFixed(0)}%)`,
        impact: 'Consider different tool or fundamental design change',
        severity: 'major',
      });
    }
  }

  // 3. From registry hints
  if (intentConfig?.executionHints) {
    const rules = intentConfig.executionHints.preflightRules;
    if (rules.length > 0) {
      suggestions.push({
        title: 'Check preflight rules from domain config',
        impact: rules.slice(0, 2).join('; '),
        severity: 'moderate',
      });
    }
  }

  // Deduplicate by title
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    if (seen.has(s.title)) return false;
    seen.add(s.title);
    return true;
  }).slice(0, 5);
}

// ─── Severity badge ─────────────────────────────────────────

const severityVariant = { minor: 'info', moderate: 'warning', major: 'danger' } as const;

// ─── Operator display ───────────────────────────────────────

const opSymbols: Record<string, string> = {
  lt: '<', lte: '≤', gt: '>', gte: '≥', eq: '=',
};

// ─── Main component ─────────────────────────────────────────

const FailureAnalysisPanel: React.FC<FailureAnalysisPanelProps> = ({
  card,
  evidence,
  previousEvidence,
  intentConfig,
  compact = false,
  onEditConfig,
  onRerun,
}) => {
  const failures = analyzeFailures(evidence);
  const warnings = evidence.filter((ev) => ev.passed).length; // passed but marginal handled elsewhere
  const suggestions = generateSuggestions(failures, card, previousEvidence, intentConfig);

  if (failures.length === 0) return null;

  // Previous evidence lookup
  const prevMap = previousEvidence
    ? new Map(previousEvidence.map((e) => [e.criterion, e]))
    : null;

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          <XCircle size={10} className="text-red-500" />
          <span className="text-red-600 font-medium">{failures.length} criteria failed</span>
          {suggestions.length > 0 && (
            <span className="text-content-muted">· {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2">
        <XCircle size={16} className="text-red-500" />
        <span className="text-sm font-semibold text-red-600">
          {failures.length} criteria failed
        </span>
      </div>

      {/* Failed criteria details */}
      <div className="space-y-2">
        {failures.map((f) => {
          const prev = prevMap?.get(f.ev.criterion);
          return (
            <div
              key={f.ev.id}
              className="border border-red-200 bg-red-50/30 p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <XCircle size={12} className="text-red-500 flex-shrink-0" />
                <span className="text-xs font-medium text-content-primary">
                  {f.ev.criterion}
                </span>
              </div>
              <div className="text-xs text-content-secondary ml-5 space-y-0.5">
                <div>
                  <span className="studio-mono">{f.ev.value}</span>
                  <span className="text-content-muted ml-1">
                    (target {opSymbols[f.ev.operator] ?? f.ev.operator} {f.ev.threshold})
                  </span>
                </div>
                <div className="text-red-600">
                  Overshoot: {f.direction} by{' '}
                  <span className="studio-mono">
                    {Number.isInteger(f.overshootAbs) ? f.overshootAbs : f.overshootAbs.toFixed(2)}
                  </span>
                  {f.overshootPct != null && (
                    <span className="ml-1">({f.overshootPct.toFixed(1)}%)</span>
                  )}
                </div>
                {prev && (
                  <div className="text-content-tertiary flex items-center gap-1">
                    <TrendingDown size={10} />
                    Previous: {prev.value} ({prev.passed ? 'was passing' : 'also failing'})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Suggested Actions
            </span>
          </div>
          <div className="space-y-1.5">
            {suggestions.map((s, i) => (
              <div key={i} className="border border-surface-border p-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-content-primary">
                    {i + 1}. {s.title}
                  </span>
                  <Badge variant={severityVariant[s.severity]} className="text-[9px]">
                    {s.severity}
                  </Badge>
                </div>
                <p className="text-[11px] text-content-tertiary ml-4">{s.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
        {onRerun && (
          <Button size="sm" variant="secondary" onClick={onRerun}>
            <span className="flex items-center gap-1">
              <RotateCcw size={12} />
              Re-run with current config
            </span>
          </Button>
        )}
        {onEditConfig && (
          <Button size="sm" variant="ghost" onClick={onEditConfig}>
            <span className="flex items-center gap-1">
              <Pencil size={12} />
              Edit config & re-run
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

FailureAnalysisPanel.displayName = 'FailureAnalysisPanel';

export default FailureAnalysisPanel;
