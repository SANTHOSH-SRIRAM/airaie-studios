// ============================================================
// PropertiesPanelContent — State-driven properties panel
// Renders different content based on card execution state:
//   idle (draft/ready/blocked/skipped) | running (queued/running) | completed | failed
// ============================================================

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Square,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Badge, Button, Spinner } from '@airaie/ui';
import { formatDateTime, formatDuration } from '@airaie/ui';
import type { Card, CardType, CardStatus } from '@/types/board';
import type { Board } from '@/types/board';
import type { CardRun, CardEvidence } from '@api/cards';
import type { PlanResponse, PlanExecutionStatus } from '@api/plans';
import type { IntentCardConfig, VerticalTheme } from '@/types/vertical-registry';
import { extractFieldValue, formatFieldValue } from '@hooks/useVerticalConfig';
import { useUpdateCard } from '@hooks/useCards';
import { useCardEvidence } from '@hooks/useEvidence';
import EvidenceCriteriaTable from '@components/boards/EvidenceCriteriaTable';
import { InlineError } from '@components/studio/InlineError';
import DecisionTraceViewer from '@components/studio/DecisionTraceViewer';

// --- Badge variant mappings ---

const cardTypeVariants: Record<CardType, import('@airaie/ui').BadgeVariant> = {
  analysis: 'info',
  comparison: 'info',
  sweep: 'warning',
  agent: 'neutral',
  gate: 'success',
  milestone: 'neutral',
};

const cardStatusVariants: Record<CardStatus, import('@airaie/ui').BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

// --- Props interface ---

export interface PropertiesPanelContentProps {
  card: Card;
  boardId: string;
  board?: Board;
  runs?: CardRun[];
  runsLoading?: boolean;
  evidence?: CardEvidence[];
  evidenceLoading?: boolean;
  plan?: PlanResponse | null;
  execStatus?: PlanExecutionStatus;
  intentConfig?: IntentCardConfig | null;
  theme?: VerticalTheme | null;
  depCards: Card[];
  onRunCard: () => void;
  onStopCard: () => void;
}

// --- Panel mode derivation ---

type PanelMode = 'idle' | 'running' | 'completed' | 'failed';

function derivePanelMode(status: CardStatus): PanelMode {
  switch (status) {
    case 'draft':
    case 'ready':
    case 'blocked':
    case 'skipped':
      return 'idle';
    case 'queued':
    case 'running':
      return 'running';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    default:
      return 'idle';
  }
}

// --- Elapsed time helper ---

function formatElapsed(startedAt?: string): string {
  if (!startedAt) return '--';
  const ms = Date.now() - new Date(startedAt).getTime();
  return formatDuration(Math.max(0, ms));
}

// --- Run detail expanded row ---

function RunDetailExpanded({ runId, cardId, run }: { runId: string; cardId: string; run: CardRun }) {
  const { data: runEvidence, isLoading } = useCardEvidence(cardId, { run_id: runId });

  return (
    <div className="px-6 py-3 space-y-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-content-tertiary">Run ID</span>
          <span className="font-mono text-content-primary">{run.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-content-tertiary">Status</span>
          <span className="text-content-primary font-medium">{run.status}</span>
        </div>
        {run.started_at && (
          <div className="flex justify-between">
            <span className="text-content-tertiary">Started</span>
            <span className="text-content-primary">{formatDateTime(run.started_at)}</span>
          </div>
        )}
        {run.completed_at && (
          <div className="flex justify-between">
            <span className="text-content-tertiary">Completed</span>
            <span className="text-content-primary">{formatDateTime(run.completed_at)}</span>
          </div>
        )}
        {run.duration_ms != null && (
          <div className="flex justify-between">
            <span className="text-content-tertiary">Duration</span>
            <span className="font-mono text-content-primary">{formatDuration(run.duration_ms)}</span>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider mb-2">
          Decision Trace
        </h4>
        <DecisionTraceViewer runId={runId} />
      </div>

      <div>
        <h4 className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider mb-2">
          Evidence
        </h4>
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        ) : !runEvidence || runEvidence.length === 0 ? (
          <p className="text-xs text-content-tertiary">No evidence for this run.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-content-tertiary border-b border-surface-border">
                <th className="text-left pb-1 font-medium">Criterion</th>
                <th className="text-right pb-1 font-medium">Value</th>
                <th className="text-right pb-1 font-medium">Threshold</th>
                <th className="text-center pb-1 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {runEvidence.map((ev) => (
                <tr key={ev.id} className="border-b border-surface-border/50 last:border-0">
                  <td className="py-1 text-content-primary">{ev.criterion}</td>
                  <td className="py-1 text-right font-mono">{ev.value}</td>
                  <td className="py-1 text-right font-mono text-content-muted">{ev.threshold}</td>
                  <td className="py-1 text-center">
                    {ev.passed ? (
                      <CheckCircle2 size={12} className="inline text-green-600" />
                    ) : (
                      <XCircle size={12} className="inline text-red-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

export default function PropertiesPanelContent({
  card,
  boardId,
  board,
  runs,
  runsLoading,
  evidence,
  evidenceLoading,
  plan,
  execStatus,
  intentConfig,
  theme,
  depCards,
  onRunCard,
  onStopCard,
}: PropertiesPanelContentProps) {
  const mode = derivePanelMode(card.status);
  const updateCardMutation = useUpdateCard();

  // --- Config editing state (moved from CardDetailPage) ---
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});

  const configEntries = Object.entries(card.config ?? {});
  const kpiEntries = Object.entries(card.kpis ?? {});

  const handleStartEditConfig = useCallback(() => {
    const draft: Record<string, string> = {};
    for (const [key, value] of Object.entries(card.config ?? {})) {
      draft[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
    setConfigDraft(draft);
    setEditingConfig(true);
  }, [card]);

  const handleCancelEditConfig = useCallback(() => {
    setEditingConfig(false);
    setConfigDraft({});
  }, []);

  const handleSaveConfig = useCallback(() => {
    const parsed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(configDraft)) {
      try {
        parsed[key] = JSON.parse(value);
      } catch {
        parsed[key] = value;
      }
    }
    updateCardMutation.mutate(
      { id: card.id, config: parsed },
      { onSuccess: () => setEditingConfig(false) },
    );
  }, [card, configDraft, updateCardMutation]);

  const handleConfigValueChange = useCallback((key: string, value: string) => {
    setConfigDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --- Run expansion & comparison state (moved from CardDetailPage) ---
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());

  const toggleRunSelection = useCallback((runId: string) => {
    setSelectedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else if (next.size < 2) next.add(runId);
      return next;
    });
  }, []);

  return (
    <div className="h-full overflow-auto p-4 border-l border-surface-border bg-white space-y-4">
      {/* Card status summary — always visible */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Status</h3>
        <div className="flex items-center gap-2">
          <Badge variant={cardStatusVariants[card.status]} dot>
            {card.status}
          </Badge>
        </div>
        <div className="text-xs text-content-muted space-y-1">
          {card.started_at && (
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>Started: {formatDateTime(card.started_at)}</span>
            </div>
          )}
          {card.completed_at && (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-600" />
              <span>Completed: {formatDateTime(card.completed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* === IDLE VIEW (D-03) === */}
      {mode === 'idle' && (
        <>
          {/* Configuration section with inline editing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                Configuration
              </h3>
              {!editingConfig && configEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartEditConfig}
                  className="flex items-center gap-1 text-[10px] text-content-muted hover:text-brand-secondary transition-colors"
                >
                  <Pencil size={10} />
                  Edit
                </button>
              )}
              {editingConfig && (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={handleCancelEditConfig}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Save}
                    onClick={handleSaveConfig}
                    loading={updateCardMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
            {configEntries.length === 0 ? (
              <p className="text-xs text-content-tertiary">No configuration parameters.</p>
            ) : editingConfig ? (
              <div className="space-y-2">
                {Object.entries(configDraft).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 text-sm border-b border-surface-border last:border-0 pb-2 last:pb-0"
                  >
                    <span className="text-content-tertiary font-mono text-xs min-w-[80px] flex-shrink-0">
                      {key}
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleConfigValueChange(key, e.target.value)}
                      className="flex-1 text-xs font-mono px-2 py-1 border border-surface-border bg-white focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/20 transition-colors"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {configEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between text-sm border-b border-surface-border last:border-0 pb-1.5 last:pb-0"
                  >
                    <span className="text-content-tertiary font-mono text-xs">{key}</span>
                    <span className="text-content-primary font-medium text-xs">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Domain Metadata */}
          {intentConfig?.detailFields && intentConfig.detailFields.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                Domain Metadata
              </h3>
              <div className="grid grid-cols-1 gap-y-2">
                {intentConfig.detailFields.map((field) => {
                  const value = extractFieldValue(card, field.key);
                  if (value == null) return null;
                  return (
                    <div key={field.key} className="flex flex-col">
                      <span className="text-[10px] text-content-tertiary">{field.label}</span>
                      <span className="text-xs font-medium text-content-primary studio-mono">
                        {formatFieldValue(value, field.format, field.unit)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Run button */}
          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={onRunCard}
            disabled={card.status === 'blocked'}
            className="w-full"
          >
            Run
          </Button>
        </>
      )}

      {/* === RUNNING VIEW (D-04) === */}
      {mode === 'running' && (
        <>
          {/* Progress section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
              Progress
            </h3>
            {execStatus ? (
              <div className="space-y-2">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-content-muted studio-mono">
                      {execStatus.completed_steps}/{execStatus.total_steps} steps
                    </span>
                    <span className="text-xs font-medium text-content-primary studio-mono">
                      {execStatus.total_steps > 0
                        ? Math.round((execStatus.completed_steps / execStatus.total_steps) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-bg border border-surface-border relative overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${execStatus.total_steps > 0
                          ? Math.round((execStatus.completed_steps / execStatus.total_steps) * 100)
                          : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Current step */}
                {execStatus.steps && execStatus.steps.length > 0 && (() => {
                  const activeStep = execStatus.steps.find((s) => s.status === 'running');
                  if (!activeStep) return null;
                  return (
                    <div className="flex items-center gap-2 text-xs">
                      <Loader2 size={12} className="text-blue-500 animate-spin" />
                      <span className="text-content-primary">{activeStep.tool_name}</span>
                    </div>
                  );
                })()}

                {/* Elapsed time */}
                <div className="flex items-center gap-1 text-xs text-content-muted">
                  <Clock size={10} />
                  <span>Elapsed: {formatElapsed(card.started_at)}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <Loader2 size={12} className="animate-spin" />
                <span>Waiting for execution status...</span>
              </div>
            )}
          </div>

          {/* Live KPIs */}
          {kpiEntries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                KPIs
              </h3>
              <div className="space-y-1.5">
                {kpiEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between text-sm border-b border-surface-border last:border-0 pb-1.5 last:pb-0"
                  >
                    <span className="text-content-tertiary font-mono text-xs">{key}</span>
                    <span className="text-content-primary font-medium text-xs font-mono">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stop button */}
          <Button
            variant="outline"
            size="sm"
            icon={Square}
            onClick={onStopCard}
            className="w-full"
          >
            Stop
          </Button>
        </>
      )}

      {/* === COMPLETED VIEW (D-05) === */}
      {mode === 'completed' && (
        <>
          {/* KPI metrics with pass/fail indicators */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
              KPI Results
            </h3>
            {kpiEntries.length === 0 ? (
              <p className="text-xs text-content-tertiary">No KPIs defined.</p>
            ) : (
              <div className="space-y-1.5">
                {kpiEntries.map(([key, value]) => {
                  // Check evidence for pass/fail status
                  const matchingEvidence = evidence?.find(
                    (ev) => ev.criterion === key || ev.criterion.toLowerCase() === key.toLowerCase(),
                  );
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm border-b border-surface-border last:border-0 pb-1.5 last:pb-0"
                    >
                      <span className="text-content-tertiary font-mono text-xs">{key}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-content-primary font-medium text-xs font-mono">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                        {matchingEvidence && (
                          matchingEvidence.passed ? (
                            <CheckCircle2 size={12} className="text-green-600" />
                          ) : (
                            <XCircle size={12} className="text-red-600" />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evidence summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
              Evidence
            </h3>
            {evidenceLoading ? (
              <div className="flex justify-center py-2">
                <Spinner size="sm" />
              </div>
            ) : (
              <EvidenceCriteriaTable evidence={evidence ?? []} compact />
            )}
          </div>

          {/* Run history */}
          <RunsSection
            runs={runs}
            runsLoading={runsLoading}
            cardId={card.id}
            expandedRunId={expandedRunId}
            setExpandedRunId={setExpandedRunId}
            selectedRunIds={selectedRunIds}
            toggleRunSelection={toggleRunSelection}
          />

          {/* Re-run button */}
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={onRunCard}
            className="w-full"
          >
            Re-run
          </Button>
        </>
      )}

      {/* === FAILED VIEW (D-06) === */}
      {mode === 'failed' && (
        <>
          {/* Inline error */}
          <InlineError
            error={{
              message: (card as any)?.error?.message
                ?? card.evidence_summary
                  ? `${card.evidence_summary?.failed ?? 0} of ${card.evidence_summary?.total ?? 0} criteria failed`
                  : 'Execution failed',
              status: 500,
              code: 'EXECUTION_FAILED',
            }}
          />

          {/* Evidence of what passed */}
          {evidence && evidence.some((e) => e.passed) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                Passed Criteria
              </h3>
              <EvidenceCriteriaTable evidence={evidence.filter((e) => e.passed)} compact />
            </div>
          )}

          {/* Evidence of what failed */}
          {evidence && evidence.some((e) => !e.passed) && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
                Failed Criteria
              </h3>
              <EvidenceCriteriaTable evidence={evidence.filter((e) => !e.passed)} compact />
            </div>
          )}

          {/* Run history for failed state too */}
          <RunsSection
            runs={runs}
            runsLoading={runsLoading}
            cardId={card.id}
            expandedRunId={expandedRunId}
            setExpandedRunId={setExpandedRunId}
            selectedRunIds={selectedRunIds}
            toggleRunSelection={toggleRunSelection}
          />

          {/* Retry button */}
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={onRunCard}
            className="w-full"
          >
            Retry
          </Button>
        </>
      )}

      {/* === COMMON FOOTER: Dependencies (always visible) === */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
          Dependencies
        </h3>
        {depCards.length === 0 ? (
          <p className="text-xs text-content-tertiary">No dependencies.</p>
        ) : (
          <div className="space-y-1.5">
            {depCards.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between py-1 border-b border-surface-border last:border-0"
              >
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/boards/${boardId}/cards/${dep.id}`}
                    className="text-xs font-medium text-content-primary hover:text-brand-secondary transition-colors"
                  >
                    {dep.name}
                  </Link>
                  <Badge variant={cardTypeVariants[dep.type]} className="text-[8px]">
                    {dep.type}
                  </Badge>
                </div>
                <Badge variant={cardStatusVariants[dep.status]} dot className="text-[8px]">
                  {dep.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Runs section sub-component (reused in completed & failed views) ---

interface RunsSectionProps {
  runs?: CardRun[];
  runsLoading?: boolean;
  cardId: string;
  expandedRunId: string | null;
  setExpandedRunId: (id: string | null) => void;
  selectedRunIds: Set<string>;
  toggleRunSelection: (id: string) => void;
}

function RunsSection({
  runs,
  runsLoading,
  cardId,
  expandedRunId,
  setExpandedRunId,
  selectedRunIds,
  toggleRunSelection,
}: RunsSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
        Runs
      </h3>
      {runsLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : !runs || runs.length === 0 ? (
        <p className="text-xs text-content-tertiary">No runs executed yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-content-tertiary border-b border-surface-border">
              <th className="text-left pb-1 font-medium w-4"></th>
              <th className="text-left pb-1 font-medium">Run ID</th>
              <th className="text-left pb-1 font-medium">Status</th>
              <th className="text-right pb-1 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, idx) => {
              const isExpanded = expandedRunId === run.id;
              const isLatest = idx === 0;
              return (
                <React.Fragment key={run.id}>
                  <tr
                    className={`border-b border-surface-border last:border-0 cursor-pointer hover:bg-slate-50 select-none ${isLatest ? 'bg-blue-50/30' : ''}`}
                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  >
                    <td className="py-1 pl-1">
                      <ChevronDown
                        size={10}
                        className={`text-content-muted transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </td>
                    <td className="py-1 font-mono text-content-primary">
                      {run.id.slice(0, 8)}
                    </td>
                    <td className="py-1">
                      <Badge
                        variant={
                          run.status === 'completed'
                            ? 'success'
                            : run.status === 'failed'
                              ? 'danger'
                              : run.status === 'running'
                                ? 'info'
                                : 'neutral'
                        }
                        dot
                        className="text-[8px]"
                      >
                        {run.status}
                      </Badge>
                    </td>
                    <td className="py-1 text-right font-mono text-content-muted">
                      {run.duration_ms != null ? formatDuration(run.duration_ms) : '--'}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={4} className="bg-slate-50 border-b border-surface-border">
                        <RunDetailExpanded runId={run.id} cardId={cardId} run={run} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
