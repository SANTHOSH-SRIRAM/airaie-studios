// ============================================================
// BoardDetailPage — dashboard-style board detail with multi-panel layout
// ============================================================

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, ShieldCheck, Wrench, Brain, AlertCircle, RefreshCw, MousePointerClick } from 'lucide-react';
import { Card, Tabs, Spinner, Badge, Button } from '@airaie/ui';
import type { Tab } from '@airaie/ui';
import type { GateStatus as GateStatusType } from '@/types/board';
import { useBoardDashboard } from '@hooks/useBoardDetail';
import BoardHeader from '@components/boards/BoardHeader';
import ReadinessSpider from '@components/boards/ReadinessSpider';

// Lazy imports for heavy components
const CardGrid = React.lazy(() => import('@components/boards/CardGrid'));
const ToolShelfPanel = React.lazy(() => import('@components/boards/ToolShelfPanel'));
const PlanPreview = React.lazy(() => import('@components/boards/PlanPreview'));
const PreflightResults = React.lazy(() => import('@components/boards/PreflightResults'));
const ExecutionControls = React.lazy(() => import('@components/boards/ExecutionControls'));

// --- Tab definitions ---

const detailTabs: Tab[] = [
  { id: 'cards', label: 'Cards', icon: Layers },
  { id: 'gates', label: 'Gates', icon: ShieldCheck },
  { id: 'tools', label: 'Tools & Plan', icon: Wrench },
  { id: 'intelligence', label: 'Intelligence', icon: Brain },
];

// --- Gate status color mapping ---

function gateStatusVariant(status: GateStatusType) {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
    PASSED: 'success',
    FAILED: 'danger',
    EVALUATING: 'info',
    WAIVED: 'warning',
    PENDING: 'neutral',
  };
  return map[status] ?? 'neutral';
}

// --- Skeleton for loading state ---

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-7 w-64 bg-slate-200 rounded" />
      </div>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-slate-100 rounded" />
          <div className="h-40 bg-slate-100 rounded" />
          <div className="h-40 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );
}

// --- Main page component ---

export default function BoardDetailPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, summary, isLoading, error, refetch } = useBoardDashboard(boardId);
  const [activeTab, setActiveTab] = useState('cards');
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // --- Error state ---
  if (error || !board) {
    return (
      <div className="p-6">
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle size={32} className="text-status-danger" />
              <h2 className="text-lg font-semibold text-content-primary">
                Failed to load board
              </h2>
              <p className="text-sm text-content-tertiary max-w-md">
                {error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred while loading the board details.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // --- Gate summary counts ---
  const gateSummary = summary?.gate_summary ?? [];
  const gatesPassed = gateSummary.filter((g) => g.status === 'PASSED').length;
  const gatesPending = gateSummary.filter((g) => g.status === 'PENDING').length;
  const gatesFailed = gateSummary.filter((g) => g.status === 'FAILED').length;

  // --- Default readiness for when summary is not yet loaded ---
  const readiness = summary?.readiness ?? {
    design: 0,
    validation: 0,
    compliance: 0,
    manufacturing: 0,
    approvals: 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Board header */}
      <BoardHeader board={board} />

      {/* Dashboard two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: 2/3 width — tab navigation + content */}
        <div className="lg:col-span-2 space-y-0">
          <Tabs tabs={detailTabs} activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === 'cards' && boardId && (
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <Spinner />
                  </div>
                }
              >
                <CardGrid
                  boardId={boardId}
                  selectedCardId={selectedCardId}
                  onCardSelect={setSelectedCardId}
                />
              </React.Suspense>
            )}

            {activeTab === 'gates' && (
              <Card>
                <Card.Body>
                  <h3 className="text-sm font-semibold text-content-primary mb-3">
                    Gate Details
                  </h3>
                  {gateSummary.length === 0 ? (
                    <p className="text-sm text-content-tertiary">
                      No gates configured for this board.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {gateSummary.map((gate, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-content-muted" />
                            <span className="text-sm text-content-primary">
                              {gate.name}
                            </span>
                            <Badge variant="neutral" className="text-xs">
                              {gate.type}
                            </Badge>
                          </div>
                          <Badge variant={gateStatusVariant(gate.status)} dot>
                            {gate.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {activeTab === 'tools' && (
              <React.Suspense
                fallback={
                  <div className="flex items-center justify-center h-48">
                    <Spinner />
                  </div>
                }
              >
                {selectedCardId ? (
                  <div className="space-y-6">
                    <ToolShelfPanel cardId={selectedCardId} />
                    <PlanPreview cardId={selectedCardId} />
                    <PreflightResults cardId={selectedCardId} />
                    <ExecutionControls cardId={selectedCardId} />
                  </div>
                ) : (
                  <Card>
                    <Card.Body>
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <MousePointerClick size={24} className="text-content-muted" />
                        <p className="text-sm text-content-tertiary">
                          Select a card to view tools and plan.
                        </p>
                        <p className="text-xs text-content-muted">
                          Use the Cards tab to select a card, then return here.
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                )}
              </React.Suspense>
            )}

            {activeTab === 'intelligence' && (
              <Card>
                <Card.Body>
                  <p className="text-sm text-content-tertiary">
                    Intelligence panel will be available in a future update.
                  </p>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>

        {/* Right column: 1/3 width — stacked panels */}
        <div className="space-y-4">
          {/* Readiness spider chart */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-content-primary">
                Readiness
              </h3>
            </Card.Header>
            <Card.Body>
              <ReadinessSpider readiness={readiness} />
              {summary && (
                <div className="text-center mt-2">
                  <span className="text-2xl font-bold text-content-primary">
                    {Math.round(summary.overall_readiness)}%
                  </span>
                  <span className="text-sm text-content-tertiary ml-1">
                    overall
                  </span>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Gate summary panel */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-content-primary">
                Gate Summary
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {gatesPassed}
                  </div>
                  <div className="text-xs text-content-tertiary">Passed</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-content-muted">
                    {gatesPending}
                  </div>
                  <div className="text-xs text-content-tertiary">Pending</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-red-600">
                    {gatesFailed}
                  </div>
                  <div className="text-xs text-content-tertiary">Failed</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-content-tertiary text-center">
                {summary?.gate_count ?? 0} total gates
              </div>
            </Card.Body>
          </Card>

          {/* Recent activity panel (placeholder) */}
          <Card>
            <Card.Header>
              <h3 className="text-sm font-semibold text-content-primary">
                Recent Activity
              </h3>
            </Card.Header>
            <Card.Body>
              {summary?.card_progress ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-content-tertiary">Cards completed</span>
                    <span className="font-medium text-content-primary">
                      {summary.card_progress.completed}/{summary.card_progress.total}
                    </span>
                  </div>
                  {Object.entries(summary.card_status_breakdown ?? {}).map(
                    ([status, count]) => (
                      <div key={status} className="flex justify-between text-sm">
                        <span className="text-content-tertiary capitalize">
                          {status}
                        </span>
                        <span className="font-medium text-content-primary">
                          {count as number}
                        </span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-content-tertiary">
                  No activity yet.
                </p>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}
