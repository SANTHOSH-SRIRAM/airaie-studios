// ============================================================
// CardDetailPage — split-pane card detail with tabbed navigation
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Square,
  Pencil,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardDetail } from '@hooks/useBoards';
import { useCardDetail, useCards, useCardRuns, useUpdateCard } from '@hooks/useCards';
import { useCardEvidence } from '@hooks/useEvidence';
import { usePlan, usePlanExecutionStatus } from '@hooks/usePlan';
import { useVerticalConfig, extractFieldValue, formatFieldValue } from '@hooks/useVerticalConfig';
import VerticalBadge from '@components/boards/VerticalBadge';
import SchemaConfigEditor from '@components/studio/SchemaConfigEditor';
import ExecutionTimeline from '@components/studio/ExecutionTimeline';
import PlanViewer from '@components/studio/PlanViewer';
import PreflightReport from '@components/studio/PreflightReport';
import ExecutionProgress from '@components/studio/ExecutionProgress';
import EvidenceCriteriaTable from '@components/boards/EvidenceCriteriaTable';
import GateStatusPanel from '@components/studio/GateStatusPanel';
import EvidenceComparisonPanel from '@components/studio/EvidenceComparisonPanel';
import FailureAnalysisPanel from '@components/studio/FailureAnalysisPanel';
import CardDetailLayout from '@components/studio/CardDetailLayout';
import CardDetailTabs from '@components/studio/CardDetailTabs';
import { useCardTab } from '@hooks/useCardTab';
import '@/registry/stub-viewers'; // side-effect: register stub viewers
import type { CardRun } from '@api/cards';
import type { CardType, CardStatus, IntentParameter } from '@/types/board';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatDuration } from '@airaie/ui';
import PlanExecutionPanel from '@components/studio/PlanExecutionPanel';
import DecisionTraceViewer from '@components/studio/DecisionTraceViewer';

// --- Badge variant mappings ---

const cardTypeVariants: Record<CardType, BadgeVariant> = {
  analysis: 'info',
  comparison: 'info',
  sweep: 'warning',
  agent: 'neutral',
  gate: 'success',
  milestone: 'neutral',
};

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

// --- Run detail expanded row ---

function RunDetailExpanded({ runId, cardId, run }: { runId: string; cardId: string; run: CardRun }) {
  const { data: runEvidence, isLoading } = useCardEvidence(cardId, { run_id: runId });

  return (
    <div className="px-6 py-3 space-y-3">
      {/* Run metadata */}
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

      {/* Decision Traces */}
      <div>
        <h4 className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider mb-2">
          Decision Trace
        </h4>
        <DecisionTraceViewer runId={runId} />
      </div>

      {/* Run evidence */}
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

// --- Main page component ---

export default function CardDetailPage() {
  const { boardId, cardId } = useParams<{ boardId: string; cardId: string }>();
  const navigate = useNavigate();

  const { data: board } = useBoardDetail(boardId);
  const {
    data: card,
    isLoading: cardLoading,
    error: cardError,
  } = useCardDetail(cardId);
  const { data: allCards } = useCards(boardId);
  const { data: evidence, isLoading: evidenceLoading } = useCardEvidence(cardId, {
    latest: true,
  });
  const { data: runs, isLoading: runsLoading } = useCardRuns(cardId);
  const { data: plan } = usePlan(cardId);
  const isExecuting = card?.status === 'running';
  const { data: execStatus } = usePlanExecutionStatus(cardId, isExecuting);
  const updateCardMutation = useUpdateCard();
  const { theme, intentConfig } = useVerticalConfig(card, board);
  const [planExecutionOpen, setPlanExecutionOpen] = useState(false);

  // Tab navigation with URL persistence and state-driven defaults
  const { activeTab, setTab } = useCardTab(card?.status ?? 'draft');

  // Section refs for timeline step click scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollToSection = useCallback((step: string) => {
    sectionRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<string, string>>({});
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [selectedRunIds, setSelectedRunIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  const toggleRunSelection = useCallback((runId: string) => {
    setSelectedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else if (next.size < 2) next.add(runId);
      return next;
    });
  }, []);

  const handleStartEditConfig = useCallback(() => {
    if (!card) return;
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
    if (!card) return;
    // Parse values back — try JSON parse for objects/arrays/numbers, fallback to string
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
      { onSuccess: () => setEditingConfig(false) }
    );
  }, [card, configDraft, updateCardMutation]);

  const handleConfigValueChange = useCallback((key: string, value: string) => {
    setConfigDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --- Loading state ---
  if (cardLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  // --- Error state ---
  if (cardError || !card) {
    return (
      <div className="p-6">
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle size={32} className="text-status-danger" />
              <h2 className="text-lg font-semibold text-content-primary">
                Failed to load card
              </h2>
              <p className="text-sm text-content-tertiary">
                {cardError instanceof Error
                  ? cardError.message
                  : 'Card not found or an error occurred.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                onClick={() => navigate(`/boards/${boardId}`)}
              >
                Back to Board
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // --- Dependency cards ---
  const depCards = (allCards ?? []).filter((c) =>
    card.dependencies?.includes(c.id)
  );

  // --- Config entries ---
  const configEntries = Object.entries(card.config ?? {});

  // --- KPI entries ---
  const kpiEntries = Object.entries(card.kpis ?? {});

  return (
    <div className="flex flex-col h-screen">
      {/* Top navigation bar */}
      <div className="flex items-center gap-3 px-4 border-b border-surface-border bg-white flex-shrink-0" style={{ height: 48 }}>
        <button
          type="button"
          onClick={() => navigate(`/boards/${boardId}`)}
          className="flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <Link
            to={ROUTES.BOARDS}
            className="hover:text-content-primary transition-colors"
          >
            Boards
          </Link>
          <ChevronRight size={12} />
          <Link
            to={`/boards/${boardId}`}
            className="hover:text-content-primary transition-colors flex items-center gap-1"
          >
            {theme && <theme.icon size={11} aria-hidden="true" />}
            {board?.name ?? 'Board'}
          </Link>
          <ChevronRight size={12} />
          <span className="text-content-primary font-medium truncate">
            {card.name}
          </span>
        </nav>
      </div>

      {/* Card header — fixed above split-pane */}
      <div className="flex items-start justify-between gap-4 px-6 py-3 border-b border-surface-border bg-white flex-shrink-0">
        <div className="space-y-1.5">
          <h1 className="text-lg font-bold text-content-primary">
            {card.name}
          </h1>
          {card.description && (
            <p className="text-sm text-content-tertiary">{card.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={cardTypeVariants[card.type]}>
              {intentConfig?.displayName ?? card.type}
            </Badge>
            <Badge variant={cardStatusVariants[card.status]} dot>
              {card.status}
            </Badge>
            {theme && <VerticalBadge theme={theme} size="md" />}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-content-muted">
            {card.started_at && (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Started: {formatDateTime(card.started_at)}</span>
              </div>
            )}
            {card.completed_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-600" />
                <span>Completed: {formatDateTime(card.completed_at)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {card.status === 'running' ? (
              <Button
                variant="outline"
                size="sm"
                icon={Square}
                onClick={() => updateCardMutation.mutate({ id: card.id, status: 'skipped' })}
                loading={updateCardMutation.isPending}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => setPlanExecutionOpen(true)}
                disabled={card.status === 'completed' || card.status === 'blocked'}
              >
                Run
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Split-pane layout: canvas (tabs) + properties */}
      <div className="flex-1 overflow-hidden">
        <CardDetailLayout
          canvas={
            <CardDetailTabs activeTab={activeTab} onTabChange={setTab}>
              <div className="flex-1 overflow-hidden relative">
                {/* Intent tab */}
                <div className={activeTab === 'intent' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  <div className="flex items-center gap-2">
                    <Badge variant={cardTypeVariants[card.type]}>
                      {intentConfig?.displayName ?? card.type}
                    </Badge>
                    {theme && <VerticalBadge theme={theme} size="md" />}
                  </div>
                  {card.description && (
                    <p className="text-sm text-content-secondary">{card.description}</p>
                  )}

                  {/* Execution Timeline */}
                  {(card.selected_tool || card.execution_plan_id || card.evidence_summary || plan) && (
                    <Card>
                      <Card.Body>
                        <ExecutionTimeline
                          card={card}
                          plan={plan}
                          evidence={evidence}
                          onStepClick={scrollToSection}
                        />
                      </Card.Body>
                    </Card>
                  )}
                </div>

                {/* Inputs tab */}
                <div className={activeTab === 'inputs' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  <Card>
                    <Card.Header>
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-sm font-semibold text-content-primary">
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
                    </Card.Header>
                    <Card.Body>
                      {configEntries.length === 0 ? (
                        <p className="text-sm text-content-tertiary">
                          No configuration parameters.
                        </p>
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
                              <span className="text-content-tertiary font-mono text-xs">
                                {key}
                              </span>
                              <span className="text-content-primary font-medium text-xs">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>

                {/* Tool Shelf tab */}
                <div className={activeTab === 'tool-shelf' ? 'h-full overflow-auto p-4' : 'hidden'}>
                  <div className="flex items-center justify-center h-48 text-sm text-content-tertiary border border-dashed border-surface-border rounded">
                    Tool Shelf -- coming in Phase 5
                  </div>
                </div>

                {/* Plan tab */}
                <div className={activeTab === 'plan' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  {plan && (
                    <div ref={(el) => { sectionRefs.current.plan = el; }}>
                      <Card>
                        <Card.Header>
                          <h3 className="text-sm font-semibold text-content-primary">
                            {isExecuting ? 'Execution Progress' : 'Execution Plan'}
                          </h3>
                        </Card.Header>
                        <Card.Body>
                          {isExecuting ? (
                            <ExecutionProgress plan={plan} />
                          ) : (
                            <PlanViewer
                              plan={plan}
                              readonly={plan.status !== 'draft'}
                            />
                          )}
                        </Card.Body>
                      </Card>
                    </div>
                  )}

                  {plan?.preflight_result && (
                    <div ref={(el) => { sectionRefs.current.preflight = el; }}>
                      <Card>
                        <Card.Header>
                          <h3 className="text-sm font-semibold text-content-primary">
                            Preflight Validation
                          </h3>
                        </Card.Header>
                        <Card.Body>
                          <PreflightReport result={plan.preflight_result as any} />
                        </Card.Body>
                      </Card>
                    </div>
                  )}

                  {!plan && (
                    <div className="flex items-center justify-center h-48 text-sm text-content-tertiary border border-dashed border-surface-border rounded">
                      No execution plan generated yet. Click "Run" to create one.
                    </div>
                  )}
                </div>

                {/* Results tab */}
                <div className={activeTab === 'results' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  {/* Failure Analysis */}
                  {card.status === 'failed' && evidence && evidence.some((e) => !e.passed) && (
                    <Card className="border-red-200">
                      <Card.Header>
                        <h3 className="text-sm font-semibold text-red-600">Failure Analysis</h3>
                      </Card.Header>
                      <Card.Body>
                        <FailureAnalysisPanel
                          card={card}
                          evidence={evidence}
                          intentConfig={intentConfig}
                        />
                      </Card.Body>
                    </Card>
                  )}

                  {/* KPIs */}
                  <Card>
                    <Card.Header>
                      <h3 className="text-sm font-semibold text-content-primary">KPIs</h3>
                    </Card.Header>
                    <Card.Body>
                      {kpiEntries.length === 0 ? (
                        <p className="text-sm text-content-tertiary">No KPIs defined.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-content-tertiary border-b border-surface-border">
                              <th className="text-left pb-2 font-medium">Metric</th>
                              <th className="text-right pb-2 font-medium">Target</th>
                            </tr>
                          </thead>
                          <tbody>
                            {kpiEntries.map(([key, value]) => (
                              <tr
                                key={key}
                                className="border-b border-surface-border last:border-0"
                              >
                                <td className="py-1.5 text-content-primary">{key}</td>
                                <td className="py-1.5 text-right font-mono text-xs text-content-primary">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Evidence */}
                  <div ref={(el) => { sectionRefs.current.evidence = el; }}>
                    <Card>
                      <Card.Header>
                        <h3 className="text-sm font-semibold text-content-primary">
                          Evidence
                        </h3>
                      </Card.Header>
                      <Card.Body>
                        {evidenceLoading ? (
                          <div className="flex justify-center py-4">
                            <Spinner size="sm" />
                          </div>
                        ) : (
                          <EvidenceCriteriaTable evidence={evidence ?? []} />
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                </div>

                {/* Governance tab */}
                <div className={activeTab === 'governance' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  {boardId && (
                    <div ref={(el) => { sectionRefs.current.gate = el; }}>
                      <Card>
                        <Card.Header>
                          <h3 className="text-sm font-semibold text-content-primary">
                            Gates
                          </h3>
                        </Card.Header>
                        <Card.Body>
                          <GateStatusPanel
                            cardId={cardId!}
                            boardId={boardId}
                            evidence={evidence}
                          />
                        </Card.Body>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </CardDetailTabs>
          }
          properties={
            <div className="h-full overflow-auto p-4 border-l border-surface-border bg-white space-y-4">
              {/* Card status summary */}
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

              {/* Runs section */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Runs</h3>
                {runsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="sm" />
                  </div>
                ) : !runs || runs.length === 0 ? (
                  <p className="text-xs text-content-tertiary">
                    No runs executed yet.
                  </p>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-content-tertiary border-b border-surface-border">
                        <th className="text-left pb-1 font-medium w-4"></th>
                        <th className="text-center pb-1 font-medium w-5"></th>
                        <th className="text-left pb-1 font-medium">Run ID</th>
                        <th className="text-left pb-1 font-medium">Status</th>
                        <th className="text-right pb-1 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.map((run) => {
                        const isExpanded = expandedRunId === run.id;
                        return (
                          <React.Fragment key={run.id}>
                            <tr
                              className="border-b border-surface-border last:border-0 cursor-pointer hover:bg-slate-50 select-none"
                              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                            >
                              <td className="py-1 pl-1">
                                <ChevronDown
                                  size={10}
                                  className={`text-content-muted transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                />
                              </td>
                              <td className="py-1 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedRunIds.has(run.id)}
                                  onChange={() => toggleRunSelection(run.id)}
                                  disabled={!selectedRunIds.has(run.id) && selectedRunIds.size >= 2}
                                  className="w-3 h-3 accent-blue-600 cursor-pointer"
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
                                {run.duration_ms != null
                                  ? formatDuration(run.duration_ms)
                                  : '--'}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50 border-b border-surface-border">
                                  <RunDetailExpanded runId={run.id} cardId={run.card_id} run={run} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Compare button + panel */}
                {runs && runs.length >= 2 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={selectedRunIds.size !== 2}
                        onClick={() => setShowComparison(true)}
                      >
                        Compare ({selectedRunIds.size}/2)
                      </Button>
                      {selectedRunIds.size > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedRunIds(new Set()); setShowComparison(false); }}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {showComparison && selectedRunIds.size === 2 && (() => {
                      const ids = Array.from(selectedRunIds);
                      const baseRun = runs.find((r) => r.id === ids[0]);
                      const compRun = runs.find((r) => r.id === ids[1]);
                      if (!baseRun || !compRun) return null;
                      return (
                        <div className="mt-2">
                          <EvidenceComparisonPanel
                            cardId={cardId!}
                            baselineRun={baseRun}
                            compareRun={compRun}
                            onClose={() => setShowComparison(false)}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Domain Metadata */}
              {intentConfig?.detailFields && intentConfig.detailFields.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Domain Metadata</h3>
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

              {/* Dependencies */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">Dependencies</h3>
                {depCards.length === 0 ? (
                  <p className="text-xs text-content-tertiary">
                    No dependencies.
                  </p>
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
          }
        />
      </div>

      {/* Plan execution panel */}
      {cardId && (
        <PlanExecutionPanel
          open={planExecutionOpen}
          onClose={() => setPlanExecutionOpen(false)}
          cardId={cardId}
          cardName={card.name}
        />
      )}
    </div>
  );
}
