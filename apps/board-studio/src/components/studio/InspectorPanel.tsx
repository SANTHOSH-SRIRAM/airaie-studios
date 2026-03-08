// ============================================================
// InspectorPanel — context-sensitive right sidebar
// ============================================================

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  Eye,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
  Wrench,
  DollarSign,
  Timer,
  ExternalLink,
} from 'lucide-react';
import { Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type {
  Card,
  Gate,
  GateRequirement,
  BoardSummary,
  Board,
  CardStatus,
  GateStatus,
} from '@/types/board';
import { useCardDetail, useCardRuns } from '@hooks/useCards';
import { useGateDetail, useEvaluateGate, useApproveGate, useRejectGate, useWaiveGate } from '@hooks/useGates';
import { useVerticalConfig, extractFieldValue, formatFieldValue } from '@hooks/useVerticalConfig';
import { usePlan } from '@hooks/usePlan';
import CardConfigEditor from './CardConfigEditor';
import KPIDashboard from './KPIDashboard';
import DependencyManager from './DependencyManager';
import RunHistoryTimeline from './RunHistoryTimeline';
import DomainActions from './DomainActions';
import VerticalBadge from '@components/boards/VerticalBadge';
import CardExecutionPanel from './CardExecutionPanel';
import GateStatusPanel from './GateStatusPanel';
import FailureAnalysisPanel from './FailureAnalysisPanel';
import { AnimatedCounter } from './ExecutionAnimations';
import { useCardEvidence } from '@hooks/useEvidence';
import { useBoardChildren } from '@hooks/useBoards';

export interface InspectorPanelProps {
  selectedItemId: string | undefined;
  selectedItemType: 'card' | 'gate' | undefined;
  summary: BoardSummary | undefined;
  boardId: string;
  board?: Board;
  allCards?: Card[];
  readinessSpider?: React.ReactNode;
  onRunCard?: (cardId: string) => void;
  onStopCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onCloneCard?: (cardId: string) => void;
  onViewCardDetail?: (cardId: string) => void;
}

// --- Collapsible accordion section ---

function InspectorSection({
  title,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-surface-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-semibold text-content-secondary
          hover:bg-surface-hover transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="flex-1 text-left uppercase tracking-wider">{title}</span>
        {badge}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

// --- Card Inspector ---

function CardInspector({
  cardId,
  boardId,
  board,
  allCards = [],
  onRunCard,
  onStopCard,
  onDeleteCard,
  onCloneCard,
  onViewCardDetail,
}: {
  cardId: string;
  boardId: string;
  board?: Board;
  allCards?: Card[];
  onRunCard?: (cardId: string) => void;
  onStopCard?: (cardId: string) => void;
  onDeleteCard?: (cardId: string) => void;
  onCloneCard?: (cardId: string) => void;
  onViewCardDetail?: (cardId: string) => void;
}) {
  const { data: card, isLoading } = useCardDetail(cardId);
  const { data: runs } = useCardRuns(cardId);
  const { data: evidence } = useCardEvidence(cardId, { latest: true });
  const { theme, intentConfig } = useVerticalConfig(card, board);
  const { data: plan } = usePlan(cardId);
  const [showExecPanel, setShowExecPanel] = useState(false);

  if (isLoading || !card) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const kpiEntries = Object.entries(card.kpis ?? {});
  const configEntries = Object.entries(card.config ?? {});

  // Resolve icon for header
  const HeaderIcon = intentConfig?.icon ?? theme?.icon ?? Layers;

  return (
    <div>
      {/* Card header — vertical-aware */}
      <div className="px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2 mb-1">
          <HeaderIcon size={14} className="text-content-tertiary flex-shrink-0" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-content-primary truncate">
            {card.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={statusVariantFor(card.status)} dot className="text-[10px]">
            {card.status}
          </Badge>
          <Badge variant="neutral" className="text-[10px]">
            {intentConfig?.displayName ?? card.type}
          </Badge>
          {theme && <VerticalBadge theme={theme} />}
        </div>
      </div>

      {/* Properties */}
      <InspectorSection title="Properties">
        <div className="space-y-2 text-xs">
          {card.description && (
            <p className="text-content-secondary leading-relaxed">{card.description}</p>
          )}
          <PropertyRow label="Ordinal" value={String(card.ordinal)} />
          <PropertyRow label="Dependencies" value={card.dependencies?.length ? card.dependencies.length.toString() : 'None'} />
          {card.started_at && (
            <PropertyRow label="Started" value={new Date(card.started_at).toLocaleString()} />
          )}
          {card.completed_at && (
            <PropertyRow label="Completed" value={new Date(card.completed_at).toLocaleString()} />
          )}
        </div>
      </InspectorSection>

      {/* Execution — shown when card has any execution data */}
      {(card.execution_plan_id || card.selected_tool || card.evidence_summary) && (
        <InspectorSection title="Execution" badge={
          card.preflight_status ? (
            <Badge
              variant={card.preflight_status === 'passed' ? 'success' : card.preflight_status === 'failed' ? 'danger' : 'neutral'}
              className="text-[9px]"
            >
              {card.preflight_status}
            </Badge>
          ) : undefined
        }>
          <div className="space-y-2.5">
            {/* Selected tool + trust badge */}
            {card.selected_tool && (
              <div className="flex items-center gap-2">
                <Wrench size={12} className="text-content-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-content-primary truncate block">
                    {card.selected_tool.slug}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {card.selected_tool.version && (
                      <span className="text-[10px] text-content-muted studio-mono">
                        v{card.selected_tool.version}
                      </span>
                    )}
                    <Badge
                      variant={
                        card.selected_tool.trust_level === 'certified' ? 'success' :
                        card.selected_tool.trust_level === 'verified' ? 'info' : 'warning'
                      }
                      className="text-[9px]"
                    >
                      {card.selected_tool.trust_level}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Plan summary */}
            {plan && (
              <div className="flex items-center gap-3 text-[11px] text-content-muted">
                {plan.steps && (
                  <span>{plan.steps.length} step{plan.steps.length !== 1 ? 's' : ''}</span>
                )}
                {card.cost_estimate != null && (
                  <span className="flex items-center gap-0.5">
                    <DollarSign size={10} />
                    ~${card.cost_estimate.toFixed(2)}
                  </span>
                )}
                {card.time_estimate && (
                  <span className="flex items-center gap-0.5">
                    <Timer size={10} />
                    {card.time_estimate}
                  </span>
                )}
              </div>
            )}

            {/* Preflight summary */}
            {(card.preflight_blockers != null || card.preflight_warnings != null) && (
              <div className="flex items-center gap-2 text-[11px]">
                <ShieldCheck size={12} className="text-content-muted shrink-0" />
                {card.preflight_blockers != null && card.preflight_blockers > 0 && (
                  <span className="text-red-600">{card.preflight_blockers} blocker{card.preflight_blockers !== 1 ? 's' : ''}</span>
                )}
                {card.preflight_warnings != null && card.preflight_warnings > 0 && (
                  <span className="text-amber-500">{card.preflight_warnings} warning{card.preflight_warnings !== 1 ? 's' : ''}</span>
                )}
                {card.preflight_blockers === 0 && card.preflight_warnings === 0 && (
                  <span className="text-green-600">All checks passed</span>
                )}
              </div>
            )}

            {/* Evidence summary bar */}
            {card.evidence_summary && card.evidence_summary.total > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-content-muted uppercase tracking-wider">Evidence</span>
                  <span className="text-[10px] text-content-muted studio-mono">
                    {card.evidence_summary.passed}/{card.evidence_summary.total} pass
                    {card.evidence_summary.warnings > 0 && ` · ${card.evidence_summary.warnings} warn`}
                  </span>
                </div>
                <div className="h-1.5 bg-surface-bg border border-surface-border flex overflow-hidden">
                  {card.evidence_summary.passed > 0 && (
                    <div className="h-full bg-green-500" style={{ width: `${(card.evidence_summary.passed / card.evidence_summary.total) * 100}%` }} />
                  )}
                  {card.evidence_summary.warnings > 0 && (
                    <div className="h-full bg-amber-400" style={{ width: `${(card.evidence_summary.warnings / card.evidence_summary.total) * 100}%` }} />
                  )}
                  {card.evidence_summary.failed > 0 && (
                    <div className="h-full bg-red-500" style={{ width: `${(card.evidence_summary.failed / card.evidence_summary.total) * 100}%` }} />
                  )}
                </div>
              </div>
            )}

            {/* Compact failure analysis */}
            {card.status === 'failed' && evidence && evidence.some((e) => !e.passed) && (
              <div className="mb-2 p-2 border border-red-200 bg-red-50/30">
                <FailureAnalysisPanel
                  card={card}
                  evidence={evidence}
                  intentConfig={intentConfig}
                  compact
                />
                {onViewCardDetail && (
                  <button
                    className="text-[10px] text-blue-600 hover:underline mt-1"
                    onClick={() => onViewCardDetail(cardId)}
                  >
                    View Full Analysis →
                  </button>
                )}
              </div>
            )}

            {/* Open Execution Panel button */}
            <Button
              variant="outline"
              size="sm"
              icon={ExternalLink}
              className="w-full"
              onClick={() => setShowExecPanel(true)}
            >
              Open Execution Panel
            </Button>
          </div>
        </InspectorSection>
      )}

      {/* CardExecutionPanel overlay */}
      {showExecPanel && card && (
        <CardExecutionPanel
          card={card}
          board={board}
          onClose={() => setShowExecPanel(false)}
        />
      )}

      {/* Gates — card-centric gate status */}
      <InspectorSection title="Gates" defaultOpen={false}>
        <GateStatusPanel
          cardId={cardId}
          boardId={boardId}
          evidence={evidence}
          compact
        />
      </InspectorSection>

      {/* Domain detail fields from intent config */}
      {intentConfig?.detailFields && intentConfig.detailFields.length > 0 && (
        <InspectorSection title="Domain Properties">
          <div className="space-y-2 text-xs">
            {intentConfig.detailFields.map((field) => {
              const value = extractFieldValue(card, field.key);
              if (value == null) return null;
              return (
                <PropertyRow
                  key={field.key}
                  label={field.label}
                  value={formatFieldValue(value, field.format, field.unit)}
                />
              );
            })}
          </div>
        </InspectorSection>
      )}

      {/* KPIs */}
      {kpiEntries.length > 0 && (
        <InspectorSection title="KPIs" badge={<span className="text-[10px] text-content-muted studio-mono">{kpiEntries.length}</span>}>
          <KPIDashboard kpis={card.kpis} />
        </InspectorSection>
      )}

      {/* Config */}
      {configEntries.length > 0 && (
        <InspectorSection title="Configuration" defaultOpen={false}>
          <CardConfigEditor cardId={card.id} config={card.config} />
        </InspectorSection>
      )}

      {/* Dependencies */}
      <InspectorSection title="Dependencies" defaultOpen={false}>
        <DependencyManager card={card} allCards={allCards} boardId={boardId} />
      </InspectorSection>

      {/* Run history */}
      {runs && runs.length > 0 && (
        <InspectorSection title="Run History" badge={<span className="text-[10px] text-content-muted studio-mono">{runs.length}</span>}>
          <RunHistoryTimeline cardId={card.id} />
        </InspectorSection>
      )}

      {/* Actions — domain actions from registry, or fallback to generic */}
      <div className="px-4 py-3 space-y-2">
        {intentConfig?.actions && intentConfig.actions.length > 0 ? (
          <DomainActions
            actions={intentConfig.actions}
            card={card}
            onAction={(actionId, cardId) => {
              if (actionId === 'run' || actionId === 'rerun') onRunCard?.(cardId);
              else if (actionId === 'stop') onStopCard?.(cardId);
              // Other actions can be extended as needed
            }}
          />
        ) : (
          <>
            {card.status === 'running' ? (
              <Button
                variant="outline"
                size="sm"
                icon={Square}
                className="w-full"
                onClick={() => onStopCard?.(card.id)}
              >
                Stop Card
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                className="w-full"
                onClick={() => onRunCard?.(card.id)}
                disabled={card.status === 'completed' || card.status === 'blocked' || card.status === 'skipped'}
              >
                Run Card
              </Button>
            )}
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          className="w-full"
          onClick={() => onViewCardDetail?.(card.id)}
        >
          View Details
        </Button>
        {onCloneCard && (
          <Button
            variant="ghost"
            size="sm"
            icon={Copy}
            className="w-full"
            onClick={() => onCloneCard(card.id)}
          >
            Clone Card
          </Button>
        )}
        {onDeleteCard && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDeleteCard(card.id)}
          >
            Delete Card
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Gate Inspector ---

function GateInspector({ gateId }: { gateId: string }) {
  const { data: gate, isLoading } = useGateDetail(gateId);
  const evaluateMutation = useEvaluateGate();
  const approveMutation = useApproveGate();
  const rejectMutation = useRejectGate();
  const waiveMutation = useWaiveGate();

  if (isLoading || !gate) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const satisfied = gate.requirements?.filter((r) => r.satisfied).length ?? 0;
  const total = gate.requirements?.length ?? 0;

  return (
    <div>
      {/* Gate header */}
      <div className="px-4 py-3 border-b border-surface-border">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-content-tertiary flex-shrink-0" />
          <h3 className="text-sm font-semibold text-content-primary truncate">
            {gate.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={gateStatusVariant(gate.status)} dot className="text-[10px]">
            {gate.status}
          </Badge>
          <Badge variant="neutral" className="text-[10px]">{gate.type}</Badge>
        </div>
      </div>

      {/* Requirements */}
      <InspectorSection
        title="Requirements"
        badge={<span className="text-[10px] text-content-muted studio-mono">{satisfied}/{total}</span>}
      >
        <div className="space-y-2">
          {gate.requirements?.map((req: GateRequirement) => (
            <div key={req.id} className="flex items-start gap-2">
              {req.satisfied ? (
                <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-content-primary">{req.name}</div>
                <div className="text-[11px] text-content-muted">{req.description}</div>
                {req.metric && (
                  <div className="text-[10px] text-content-tertiary studio-mono mt-0.5">
                    {req.metric.value} {req.metric.operator} {req.metric.threshold}
                  </div>
                )}
              </div>
            </div>
          ))}
          {(!gate.requirements || gate.requirements.length === 0) && (
            <span className="text-xs text-content-muted">No requirements defined</span>
          )}
        </div>
      </InspectorSection>

      {/* Evaluation History / Audit Trail */}
      <InspectorSection title="History" defaultOpen={false} badge={
        <span className="text-[10px] text-content-muted studio-mono">
          {gate.evaluated_at || gate.approved_at || gate.rejected_at ? 'audit' : 'limited'}
        </span>
      }>
        <div className="space-y-2">
          {/* Timeline entries derived from gate fields */}
          {gate.created_at && (
            <div className="flex items-start gap-2">
              <Clock size={12} className="text-content-muted mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-content-primary">Gate Created</div>
                <div className="text-[10px] text-content-muted studio-mono">
                  {new Date(gate.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {gate.evaluated_at && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-content-primary">Evaluated</div>
                <div className="text-[10px] text-content-muted studio-mono">
                  {new Date(gate.evaluated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {gate.approved_at && (
            <div className="flex items-start gap-2">
              <CheckCircle2 size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-content-primary">Approved</div>
                <div className="text-[10px] text-content-muted studio-mono">
                  {new Date(gate.approved_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {gate.rejected_at && (
            <div className="flex items-start gap-2">
              <XCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-content-primary">Rejected</div>
                <div className="text-[10px] text-content-muted studio-mono">
                  {new Date(gate.rejected_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {gate.status === 'WAIVED' && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-content-primary">Waived</div>
                <div className="text-[10px] text-content-muted studio-mono">Status set to waived</div>
              </div>
            </div>
          )}

          {/* Current status as latest entry */}
          <div className="flex items-start gap-2 pt-1 border-t border-surface-border">
            {gate.status === 'PASSED' ? (
              <CheckCircle2 size={12} className="text-green-600 mt-0.5 flex-shrink-0" />
            ) : gate.status === 'FAILED' ? (
              <XCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
            ) : (
              <Clock size={12} className="text-content-muted mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium text-content-primary">
                Current: {gate.status}
              </div>
              <div className="text-[10px] text-content-muted">
                {!gate.evaluated_at && !gate.approved_at && !gate.rejected_at
                  ? 'Full audit trail requires backend support'
                  : 'Latest gate state'}
              </div>
            </div>
          </div>
        </div>
      </InspectorSection>

      {/* Actions */}
      {(gate.status === 'PENDING' || gate.status === 'FAILED') && (
        <div className="px-4 py-3 space-y-2">
          {gate.type === 'evidence' && (
            <Button
              variant="primary"
              size="sm"
              icon={Play}
              className="w-full"
              loading={evaluateMutation.isPending}
              onClick={() => evaluateMutation.mutate(gate.id)}
            >
              Evaluate Gate
            </Button>
          )}
          {(gate.type === 'review' || gate.type === 'compliance' || gate.type === 'manufacturing' || gate.type === 'exception') && gate.status === 'PENDING' && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                className="w-full"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate({ gateId: gate.id })}
              >
                Approve Gate
              </Button>
              <GateRejectButton
                gateId={gate.id}
                rejectMutation={rejectMutation}
              />
            </>
          )}
          {gate.status === 'FAILED' && (
            <GateWaiveButton gateId={gate.id} waiveMutation={waiveMutation} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Board Overview (when nothing selected) ---

function BoardOverview({
  summary,
  readinessSpider,
  boardId,
}: {
  summary: BoardSummary | undefined;
  readinessSpider?: React.ReactNode;
  boardId: string;
}) {
  const { data: children } = useBoardChildren(boardId);
  if (!summary) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  const gateSummary = summary.gate_summary ?? [];
  const gatesPassed = gateSummary.filter((g) => g.status === 'PASSED').length;
  const gatesPending = gateSummary.filter((g) => g.status === 'PENDING').length;
  const gatesFailed = gateSummary.filter((g) => g.status === 'FAILED').length;

  return (
    <div>
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
          Board Overview
        </h3>
      </div>

      {/* Readiness spider + dimension breakdown */}
      {readinessSpider && (
        <InspectorSection title="Readiness">
          <div className="flex flex-col items-center">
            {readinessSpider}
            <div className="text-center mt-1">
              <AnimatedCounter value={Math.round(summary.overall_readiness)} className="text-xl font-bold text-content-primary studio-mono" />
              <span className="text-xl font-bold text-content-primary studio-mono">%</span>
              <span className="text-xs text-content-tertiary ml-1">overall</span>
            </div>
          </div>
          {/* 5-dimension breakdown */}
          {summary.readiness && (
            <div className="mt-3 space-y-1.5">
              {([
                ['Design', summary.readiness.design],
                ['Validation', summary.readiness.validation],
                ['Compliance', summary.readiness.compliance],
                ['Manufacturing', summary.readiness.manufacturing],
                ['Approvals', summary.readiness.approvals],
              ] as [string, number][]).map(([label, value]) => (
                <div key={label} className="flex items-center gap-2 text-[11px]">
                  <span className="text-content-tertiary w-24 truncate">{label}</span>
                  <div className="flex-1 h-1.5 bg-surface-bg border border-surface-border overflow-hidden">
                    <div
                      className={`h-full transition-all ${value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, value)}%` }}
                    />
                  </div>
                  <span className="text-content-primary studio-mono w-8 text-right">{Math.round(value)}%</span>
                </div>
              ))}
            </div>
          )}
        </InspectorSection>
      )}

      {/* Gate summary */}
      <InspectorSection title="Gates">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-green-600 studio-mono">{gatesPassed}</div>
            <div className="text-[10px] text-content-tertiary">Passed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-content-muted studio-mono">{gatesPending}</div>
            <div className="text-[10px] text-content-tertiary">Pending</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600 studio-mono">{gatesFailed}</div>
            <div className="text-[10px] text-content-tertiary">Failed</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-content-muted text-center studio-mono">
          {summary.gate_count} total gates
        </div>
      </InspectorSection>

      {/* Card progress */}
      <InspectorSection title="Card Progress">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-content-tertiary">Completed</span>
            <span className="font-medium text-content-primary studio-mono">
              {summary.card_progress.completed}/{summary.card_progress.total}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-surface-bg border border-surface-border">
            <div
              className="h-full bg-green-500 transition-all"
              style={{
                width: summary.card_progress.total
                  ? `${(summary.card_progress.completed / summary.card_progress.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
          {/* Status breakdown */}
          {Object.entries(summary.card_status_breakdown ?? {}).map(([status, count]) => (
            <div key={status} className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-content-tertiary">
                <span className={`studio-status-dot studio-status-dot--${status}`} />
                <span className="capitalize">{status}</span>
              </span>
              <span className="font-medium text-content-primary studio-mono">{count as number}</span>
            </div>
          ))}
        </div>
      </InspectorSection>

      {/* Sub-boards */}
      {children && children.length > 0 && (
        <InspectorSection title="Sub-Boards" badge={<span className="text-[10px] text-content-muted studio-mono">{children.length}</span>}>
          <div className="space-y-2">
            {children.map((child) => (
              <div key={child.id} className="flex items-center justify-between text-xs">
                <span className="text-content-primary truncate flex-1 mr-2">{child.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="studio-mono text-content-muted">
                    {child.readiness != null ? `${Math.round(child.readiness)}%` : '--'}
                  </span>
                  <Badge
                    variant={child.mode === 'release' ? 'success' : child.mode === 'study' ? 'warning' : 'info'}
                    className="text-[9px]"
                  >
                    {child.mode}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </InspectorSection>
      )}
    </div>
  );
}

// --- Gate reject with reason input ---

function GateRejectButton({
  gateId,
  rejectMutation,
}: {
  gateId: string;
  rejectMutation: ReturnType<typeof useRejectGate>;
}) {
  const [showInput, setShowInput] = useState(false);
  const [reason, setReason] = useState('');

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={XCircle}
        className="w-full"
        onClick={() => setShowInput(true)}
      >
        Reject Gate
      </Button>
    );
  }

  return (
    <div className="space-y-2 border border-red-200 bg-red-50/50 p-2">
      <input
        type="text"
        placeholder="Reason for rejection..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white outline-none focus:border-red-400"
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 border-red-300 hover:bg-red-100"
          loading={rejectMutation.isPending}
          disabled={!reason.trim()}
          onClick={() => {
            rejectMutation.mutate(
              { gateId, rationale: reason.trim() },
              { onSuccess: () => { setShowInput(false); setReason(''); } }
            );
          }}
        >
          Confirm
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowInput(false); setReason(''); }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Gate waive with rationale input ---

function GateWaiveButton({
  gateId,
  waiveMutation,
}: {
  gateId: string;
  waiveMutation: ReturnType<typeof useWaiveGate>;
}) {
  const [showInput, setShowInput] = useState(false);
  const [rationale, setRationale] = useState('');

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="sm"
        icon={AlertTriangle}
        className="w-full"
        onClick={() => setShowInput(true)}
      >
        Waive Gate
      </Button>
    );
  }

  return (
    <div className="space-y-2 border border-amber-200 bg-amber-50/50 p-2">
      <input
        type="text"
        placeholder="Rationale for waiver..."
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white outline-none focus:border-amber-400"
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-amber-600 border-amber-300 hover:bg-amber-100"
          loading={waiveMutation.isPending}
          disabled={!rationale.trim()}
          onClick={() => {
            waiveMutation.mutate(
              { gateId, rationale: rationale.trim() },
              { onSuccess: () => { setShowInput(false); setRationale(''); } }
            );
          }}
        >
          Confirm Waive
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowInput(false); setRationale(''); }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// --- Property row ---

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-content-tertiary">{label}</span>
      <span className="font-medium text-content-primary studio-mono">{value}</span>
    </div>
  );
}

// --- Status helpers ---

const statusVariantFor = (status: CardStatus): BadgeVariant => {
  const map: Record<CardStatus, BadgeVariant> = {
    draft: 'neutral',
    ready: 'info',
    queued: 'warning',
    running: 'info',
    completed: 'success',
    failed: 'danger',
    blocked: 'warning',
    skipped: 'neutral',
  };
  return map[status] ?? 'neutral';
};

const gateStatusVariant = (status: GateStatus): BadgeVariant => {
  const map: Record<GateStatus, BadgeVariant> = {
    PENDING: 'neutral',
    EVALUATING: 'info',
    PASSED: 'success',
    FAILED: 'danger',
    WAIVED: 'warning',
  };
  return map[status] ?? 'neutral';
};

// --- Main component ---

const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedItemId,
  selectedItemType,
  summary,
  boardId,
  board,
  allCards,
  readinessSpider,
  onRunCard,
  onStopCard,
  onDeleteCard,
  onCloneCard,
  onViewCardDetail,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {selectedItemType === 'card' && selectedItemId ? (
          <CardInspector
            cardId={selectedItemId}
            boardId={boardId}
            board={board}
            allCards={allCards}
            onRunCard={onRunCard}
            onStopCard={onStopCard}
            onDeleteCard={onDeleteCard}
            onCloneCard={onCloneCard}
            onViewCardDetail={onViewCardDetail}
          />
        ) : selectedItemType === 'gate' && selectedItemId ? (
          <GateInspector gateId={selectedItemId} />
        ) : (
          <BoardOverview summary={summary} readinessSpider={readinessSpider} boardId={boardId} />
        )}
      </div>
    </div>
  );
};

InspectorPanel.displayName = 'InspectorPanel';

export default InspectorPanel;
