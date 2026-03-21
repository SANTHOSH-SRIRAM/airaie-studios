// ============================================================
// CardDetailPage — split-pane card detail with tabbed navigation
// ============================================================

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Square,
} from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardDetail } from '@hooks/useBoards';
import { useCardDetail, useCards, useCardRuns, useUpdateCard } from '@hooks/useCards';
import { useCardEvidence } from '@hooks/useEvidence';
import { usePlan, usePlanExecutionStatus } from '@hooks/usePlan';
import { useVerticalConfig } from '@hooks/useVerticalConfig';
import VerticalBadge from '@components/boards/VerticalBadge';
import ExecutionTimeline from '@components/studio/ExecutionTimeline';
import PreflightReport from '@components/studio/PreflightReport';
import PlanDAGViewer from '@components/studio/PlanDAGViewer';
import EvidenceCriteriaTable from '@components/boards/EvidenceCriteriaTable';
import GateStatusPanel from '@components/studio/GateStatusPanel';
import FailureAnalysisPanel from '@components/studio/FailureAnalysisPanel';
import CardDetailLayout from '@components/studio/CardDetailLayout';
import type { CardDetailLayoutHandle } from '@components/studio/CardDetailLayout';
import CardDetailTabs from '@components/studio/CardDetailTabs';
import { useCardTab } from '@hooks/useCardTab';
import { useKeyboardNav } from '@hooks/useKeyboardNav';
import { useHeroArtifact } from '@hooks/useHeroArtifact';
import { useCardDetailStore } from '@store/cardDetailStore';
import { useRunArtifacts, useArtifactDownloadUrl } from '@airaie/shared';
import { ArtifactPreviewRouter } from '@/registry/viewer-registry';
import ArtifactThumbnailStrip from '@components/studio/ArtifactThumbnailStrip';
import type { ThumbnailItem } from '@components/studio/ArtifactThumbnailStrip';
import '@/registry/stub-viewers'; // side-effect: register stub viewers
import type { CardType, CardStatus } from '@/types/board';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatDuration } from '@airaie/ui';
import PlanExecutionPanel from '@components/studio/PlanExecutionPanel';
import PropertiesPanelContent from '@components/studio/PropertiesPanelContent';
import ToolShelfPanel from '@components/studio/ToolShelfPanel';

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

// --- Main page component ---

export default function CardDetailPage() {
  const { boardId, cardId } = useParams<{ boardId: string; cardId: string }>();
  const navigate = useNavigate();

  // Ref for imperative access to CardDetailLayout toggle
  const layoutRef = useRef<CardDetailLayoutHandle>(null);

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

  // Tab navigation with URL persistence, state-driven defaults, and Zustand restoration
  const { activeTab, setTab } = useCardTab(card?.status ?? 'draft', cardId);

  // --- Hero artifact state ---
  const { setSession: setCardSession } = useCardDetailStore();

  // Get latest completed run for artifact loading
  const latestCompletedRun = useMemo(() => {
    if (!runs || runs.length === 0) return null;
    const completed = runs
      .filter((r) => r.status === 'completed')
      .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
    return completed[0] ?? null;
  }, [runs]);

  const { data: runArtifacts } = useRunArtifacts(latestCompletedRun?.id ?? '');
  const { heroArtifact, otherArtifacts, setHeroKey } = useHeroArtifact(intentConfig, runArtifacts);
  const downloadUrlMutation = useArtifactDownloadUrl();
  const [heroUrl, setHeroUrl] = useState<string>('');

  // Fetch presigned URL for hero artifact on-demand (D-01)
  useEffect(() => {
    if (!heroArtifact?.artifact?.key || !runArtifacts) return;
    // Find kernel artifact ID by name
    const kernelArt = runArtifacts.find((a) => a.name === heroArtifact.artifact.key);
    if (kernelArt) {
      downloadUrlMutation.mutate(kernelArt.id, {
        onSuccess: (result) => setHeroUrl((result as { download_url: string }).download_url ?? String(result)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroArtifact?.artifact?.key, runArtifacts]);

  // Build thumbnail items for the strip
  const thumbnailItems: ThumbnailItem[] = useMemo(() => {
    if (!heroArtifact) return [];
    const allItems = [heroArtifact, ...otherArtifacts];
    return allItems.map((item) => ({
      key: item.artifact.key,
      label: item.definition?.label ?? item.artifact.filename ?? item.artifact.key,
      preview: item.definition?.preview ?? 'download',
    }));
  }, [heroArtifact, otherArtifacts]);

  // Handle thumbnail click — swap hero and fetch URL
  const handleThumbnailSelect = useCallback(
    (key: string) => {
      setHeroKey(key);
      if (!runArtifacts) return;
      const kernelArt = runArtifacts.find((a) => a.name === key);
      if (kernelArt) {
        downloadUrlMutation.mutate(kernelArt.id, {
          onSuccess: (result) => setHeroUrl((result as { download_url: string }).download_url ?? String(result)),
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runArtifacts, setHeroKey],
  );

  // Scroll position persistence
  const resultsScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Restore scroll position on mount
  useEffect(() => {
    if (!cardId) return;
    const stored = useCardDetailStore.getState().getSession(cardId);
    if (stored?.scrollTop && resultsScrollRef.current) {
      resultsScrollRef.current.scrollTop = stored.scrollTop;
    }
  }, [cardId]);

  // Debounced scroll save
  const handleResultsScroll = useCallback(() => {
    if (!cardId || !resultsScrollRef.current) return;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (resultsScrollRef.current) {
        setCardSession(cardId, { scrollTop: resultsScrollRef.current.scrollTop });
      }
    }, 200);
  }, [cardId, setCardSession]);

  // Section refs for timeline step click scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollToSection = useCallback((step: string) => {
    sectionRefs.current[step]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard shortcuts: Escape → back to board, F/Cmd+Shift+F → toggle fullscreen canvas
  useKeyboardNav({
    onEscape: () => navigate(`/boards/${boardId}`),
    onToggleFullscreen: () => layoutRef.current?.toggleProperties(),
  });

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
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top navigation bar */}
      <div className="flex items-center gap-3 px-4 border-b border-surface-border bg-white flex-shrink-0 min-w-0" style={{ height: 48 }}>
        <button
          type="button"
          onClick={() => navigate(`/boards/${boardId}`)}
          className="flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-content-tertiary min-w-0">
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
      <div className="flex items-start justify-between gap-4 px-6 py-3 border-b border-surface-border bg-white flex-shrink-0 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <h1 className="text-lg font-bold text-content-primary truncate">
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
          layoutRef={layoutRef}
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

                {/* Inputs tab — read-only config view (editing moved to properties panel) */}
                <div className={activeTab === 'inputs' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  <Card>
                    <Card.Header>
                      <h3 className="text-sm font-semibold text-content-primary">
                        Configuration
                      </h3>
                    </Card.Header>
                    <Card.Body>
                      {configEntries.length === 0 ? (
                        <p className="text-sm text-content-tertiary">
                          No configuration parameters.
                        </p>
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
                  <ToolShelfPanel
                    intentType={card.intent_type}
                    projectId={board?.project_id}
                  />
                </div>

                {/* Plan tab */}
                <div className={activeTab === 'plan' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}>
                  {plan && (
                    <div ref={(el) => { sectionRefs.current.plan = el; }}>
                      <PlanDAGViewer
                        plan={plan}
                        execStatus={execStatus}
                        isExecuting={isExecuting}
                      />
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
                <div
                  ref={resultsScrollRef}
                  onScroll={handleResultsScroll}
                  className={activeTab === 'results' ? 'h-full overflow-auto p-4 space-y-4' : 'hidden'}
                >
                  {/* Hero Artifact Canvas */}
                  {heroArtifact && (
                    <Card>
                      <Card.Header>
                        <h3 className="text-sm font-semibold text-content-primary">
                          {heroArtifact.definition?.label ?? heroArtifact.artifact.filename ?? 'Artifact Preview'}
                        </h3>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="min-h-[200px]">
                          {heroUrl ? (
                            <ArtifactPreviewRouter
                              type={heroArtifact.definition?.preview ?? 'download'}
                              url={heroUrl}
                              filename={heroArtifact.artifact.filename}
                              contentType={heroArtifact.artifact.content_type}
                              sizeBytes={heroArtifact.artifact.size_bytes}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-48 text-sm text-content-tertiary">
                              Loading artifact preview...
                            </div>
                          )}
                        </div>
                        {thumbnailItems.length > 1 && (
                          <ArtifactThumbnailStrip
                            artifacts={thumbnailItems}
                            activeKey={heroArtifact.artifact.key}
                            onSelect={handleThumbnailSelect}
                          />
                        )}
                      </Card.Body>
                    </Card>
                  )}

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
            <PropertiesPanelContent
              card={card}
              boardId={boardId!}
              board={board}
              runs={runs}
              runsLoading={runsLoading}
              evidence={evidence}
              evidenceLoading={evidenceLoading}
              plan={plan}
              execStatus={execStatus}
              intentConfig={intentConfig}
              theme={theme}
              depCards={depCards}
              onRunCard={() => setPlanExecutionOpen(true)}
              onStopCard={() => updateCardMutation.mutate({ id: card.id, status: 'skipped' })}
            />
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
