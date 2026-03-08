// ============================================================
// ReleasePacketPage — fullscreen read-only release packet view
// ============================================================

import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, ShieldCheck, CheckCircle2, XCircle, Lock, FileText, Layers, AlertCircle } from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardDetail } from '@hooks/useBoards';
import { useBoardDashboard } from '@hooks/useBoardDetail';
import { useCards } from '@hooks/useCards';
import { useGates } from '@hooks/useGates';
import type { CardStatus, GateStatus } from '@/types/board';
import { ROUTES } from '@/constants/routes';
import ReadinessSpider from '@components/boards/ReadinessSpider';

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral', ready: 'info', queued: 'warning', running: 'info',
  completed: 'success', failed: 'danger', blocked: 'warning', skipped: 'neutral',
};
const gateStatusVariants: Record<GateStatus, BadgeVariant> = {
  PENDING: 'neutral', EVALUATING: 'info', PASSED: 'success', FAILED: 'danger', WAIVED: 'warning',
};

export default function ReleasePacketPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { board, summary, isLoading, error } = useBoardDashboard(boardId);
  const { data: cards = [], isLoading: cardsLoading } = useCards(boardId);
  const { data: gates = [], isLoading: gatesLoading } = useGates(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-bg">
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle size={32} className="text-status-danger" />
              <h2 className="text-lg font-semibold text-content-primary">Failed to load board</h2>
              <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate(`/boards/${boardId}`)}>
                Back to Board
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const readiness = summary?.readiness ?? { design: 0, validation: 0, compliance: 0, manufacturing: 0, approvals: 0 };
  const overallReadiness = summary?.overall_readiness ?? 0;
  const gatesPassed = gates.filter(g => g.status === 'PASSED').length;
  const cardsCompleted = cards.filter(c => c.status === 'completed').length;

  return (
    <div className="flex flex-col h-screen bg-surface-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-6 border-b border-surface-border bg-white flex-shrink-0" style={{ height: 48 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/boards/${boardId}`)} className="text-content-tertiary hover:text-content-primary transition-colors">
            <ArrowLeft size={16} />
          </button>
          <nav className="flex items-center gap-1.5 text-xs text-content-tertiary">
            <Link to={ROUTES.BOARDS} className="hover:text-content-primary transition-colors">Boards</Link>
            <ChevronRight size={12} />
            <Link to={`/boards/${boardId}`} className="hover:text-content-primary transition-colors">{board.name}</Link>
            <ChevronRight size={12} />
            <span className="text-content-primary font-medium">Release Packet</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-content-muted" />
          <span className="text-xs text-content-muted">Read-only snapshot</span>
          <Badge variant="success" dot>release</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-content-muted">
              <FileText size={20} />
              <span className="text-xs uppercase tracking-widest font-semibold">Release Packet</span>
            </div>
            <h1 className="text-2xl font-bold text-content-primary">{board.name}</h1>
            <p className="text-sm text-content-tertiary">
              Generated {new Date().toLocaleString()} &middot; Mode: {board.mode} &middot; Status: {board.status}
            </p>
          </div>

          {/* Readiness overview */}
          <Card>
            <Card.Header>
              <h2 className="text-sm font-semibold text-content-primary">Readiness Overview</h2>
            </Card.Header>
            <Card.Body>
              <div className="flex items-center gap-8">
                <div className="flex-shrink-0">
                  <ReadinessSpider readiness={readiness} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-content-primary">{Math.round(overallReadiness)}%</div>
                    <div className="text-xs text-content-tertiary mt-1">Overall Readiness</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-content-primary">{cards.length}</div>
                      <div className="text-[10px] text-content-tertiary">Cards</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{cardsCompleted}</div>
                      <div className="text-[10px] text-content-tertiary">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-content-primary">{gates.length}</div>
                      <div className="text-[10px] text-content-tertiary">Gates</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Gate proofs */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content-primary">Gate Proofs</h2>
                <span className="text-xs text-content-muted">{gatesPassed}/{gates.length} passed</span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {gatesLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : gates.length === 0 ? (
                <p className="text-sm text-content-tertiary p-4">No gates configured.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-slate-50">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Gate</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Type</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-content-secondary">Requirements</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-content-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gates.map(gate => {
                      const satisfied = gate.requirements?.filter(r => r.satisfied).length ?? 0;
                      const total = gate.requirements?.length ?? 0;
                      return (
                        <tr key={gate.id} className="border-b border-surface-border last:border-0">
                          <td className="px-4 py-3">
                            <div className="font-medium text-content-primary">{gate.name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral" className="text-[10px]">{gate.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-xs font-mono text-content-secondary">{satisfied}/{total}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={gateStatusVariants[gate.status]} dot>{gate.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card.Body>
          </Card>

          {/* Card evidence bundle */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-content-primary">Card Evidence Bundle</h2>
                <span className="text-xs text-content-muted">{cardsCompleted}/{cards.length} completed</span>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {cardsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : cards.length === 0 ? (
                <p className="text-sm text-content-tertiary p-4">No cards in this board.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-slate-50">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">#</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Card</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-content-secondary">Type</th>
                      <th className="text-center px-4 py-2 text-xs font-semibold text-content-secondary">Status</th>
                      <th className="text-right px-4 py-2 text-xs font-semibold text-content-secondary">KPIs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card, i) => {
                      const kpiCount = Object.keys(card.kpis ?? {}).length;
                      return (
                        <tr key={card.id} className="border-b border-surface-border last:border-0">
                          <td className="px-4 py-3 text-xs text-content-muted font-mono">{i + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-content-primary">{card.name}</div>
                            {card.description && (
                              <div className="text-xs text-content-tertiary mt-0.5 truncate max-w-[300px]">{card.description}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral" className="text-[10px]">{card.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={cardStatusVariants[card.status]} dot>{card.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-mono text-content-muted">
                            {kpiCount > 0 ? `${kpiCount} KPIs` : '--'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card.Body>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-content-muted pt-4 border-t border-surface-border">
            <p>Release packet for <strong>{board.name}</strong> &middot; Board ID: {board.id}</p>
            <p className="mt-1">This is a read-only snapshot of the board state at time of generation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
