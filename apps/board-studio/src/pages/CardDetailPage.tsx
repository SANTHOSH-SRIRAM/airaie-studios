// ============================================================
// CardDetailPage — full-page card detail with evidence, runs, dependencies
// ============================================================

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardDetail } from '@hooks/useBoards';
import { useCardDetail, useCards, useCardRuns } from '@hooks/useCards';
import { useCardEvidence } from '@hooks/useEvidence';
import type { CardType, CardStatus } from '@/types/board';
import { ROUTES } from '@/constants/routes';
import { formatDateTime, formatDuration } from '@airaie/ui';

// --- Badge variant mappings ---

const cardTypeVariants: Record<CardType, BadgeVariant> = {
  simulation: 'info',
  optimization: 'info',
  validation: 'success',
  manufacturing: 'warning',
  analysis: 'neutral',
  custom: 'neutral',
  research: 'neutral',
};

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
  waived: 'warning',
  cancelled: 'neutral',
};

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
    <div className="p-6 space-y-6">
      {/* Back button and breadcrumb */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate(`/boards/${boardId}`)}
          className="flex items-center gap-1.5 text-sm text-content-tertiary hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to board
        </button>

        <nav className="flex items-center gap-1.5 text-sm text-content-tertiary">
          <Link
            to={ROUTES.BOARDS}
            className="hover:text-content-primary transition-colors"
          >
            Boards
          </Link>
          <ChevronRight size={14} />
          <Link
            to={`/boards/${boardId}`}
            className="hover:text-content-primary transition-colors"
          >
            {board?.name ?? 'Board'}
          </Link>
          <ChevronRight size={14} />
          <span className="text-content-primary font-medium truncate">
            {card.name || card.title}
          </span>
        </nav>
      </div>

      {/* Card header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-content-primary">
            {card.name || card.title}
          </h1>
          {card.description && (
            <p className="text-sm text-content-tertiary">{card.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={cardTypeVariants[card.type]}>{card.type}</Badge>
            <Badge variant={cardStatusVariants[card.status]} dot>
              {card.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-content-muted flex-shrink-0">
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
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration section */}
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

        {/* KPIs section */}
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

        {/* Evidence section */}
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
            ) : !evidence || evidence.length === 0 ? (
              <p className="text-sm text-content-tertiary">
                No evidence collected yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-content-tertiary border-b border-surface-border">
                    <th className="text-left pb-2 font-medium">Criterion</th>
                    <th className="text-right pb-2 font-medium">Value</th>
                    <th className="text-right pb-2 font-medium">Threshold</th>
                    <th className="text-center pb-2 font-medium">Op</th>
                    <th className="text-center pb-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.map((ev) => (
                    <tr
                      key={ev.id}
                      className="border-b border-surface-border last:border-0"
                    >
                      <td className="py-1.5 text-content-primary">
                        {ev.criterion}
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs">
                        {ev.value}
                      </td>
                      <td className="py-1.5 text-right font-mono text-xs text-content-muted">
                        {ev.threshold}
                      </td>
                      <td className="py-1.5 text-center text-xs text-content-muted">
                        {ev.operator}
                      </td>
                      <td className="py-1.5 text-center">
                        {ev.passed ? (
                          <CheckCircle2
                            size={14}
                            className="inline text-green-600"
                          />
                        ) : (
                          <XCircle
                            size={14}
                            className="inline text-red-600"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card.Body>
        </Card>

        {/* Runs section */}
        <Card>
          <Card.Header>
            <h3 className="text-sm font-semibold text-content-primary">Runs</h3>
          </Card.Header>
          <Card.Body>
            {runsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : !runs || runs.length === 0 ? (
              <p className="text-sm text-content-tertiary">
                No runs executed yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-content-tertiary border-b border-surface-border">
                    <th className="text-left pb-2 font-medium">Run ID</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-left pb-2 font-medium">Started</th>
                    <th className="text-right pb-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-surface-border last:border-0 cursor-pointer hover:bg-slate-50"
                    >
                      <td className="py-1.5 font-mono text-xs text-content-primary">
                        {run.id.slice(0, 8)}
                      </td>
                      <td className="py-1.5">
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
                          className="text-[10px]"
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-1.5 text-xs text-content-muted">
                        {run.started_at ? formatDateTime(run.started_at) : '--'}
                      </td>
                      <td className="py-1.5 text-right text-xs font-mono text-content-muted">
                        {run.duration_ms != null
                          ? formatDuration(run.duration_ms)
                          : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Dependencies section (full width) */}
      <Card>
        <Card.Header>
          <h3 className="text-sm font-semibold text-content-primary">
            Dependencies
          </h3>
        </Card.Header>
        <Card.Body>
          {depCards.length === 0 ? (
            <p className="text-sm text-content-tertiary">
              This card has no dependencies.
            </p>
          ) : (
            <div className="space-y-2">
              {depCards.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between py-2 border-b border-surface-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/boards/${boardId}/cards/${dep.id}`}
                      className="text-sm font-medium text-content-primary hover:text-[#3b5fa8] transition-colors"
                    >
                      {dep.name}
                    </Link>
                    <Badge variant={cardTypeVariants[dep.type]} className="text-[10px]">
                      {dep.type}
                    </Badge>
                  </div>
                  <Badge variant={cardStatusVariants[dep.status]} dot className="text-[10px]">
                    {dep.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
