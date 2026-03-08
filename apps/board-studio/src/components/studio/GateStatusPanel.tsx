// ============================================================
// GateStatusPanel — card-centric gate view with approval workflow
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Gate, GateStatus, GateRequirement } from '@/types/board';
import type { CardEvidence } from '@api/cards';
import { useGates, useEvaluateGate, useApproveGate, useRejectGate, useWaiveGate } from '@hooks/useGates';

// ─── Props ──────────────────────────────────────────────────

export interface GateStatusPanelProps {
  cardId: string;
  boardId: string;
  evidence?: CardEvidence[];
  /** Compact mode for inspector sidebar */
  compact?: boolean;
}

// ─── Status styling ─────────────────────────────────────────

const gateStatusVariants: Record<GateStatus, BadgeVariant> = {
  PENDING: 'neutral',
  EVALUATING: 'info',
  PASSED: 'success',
  FAILED: 'danger',
  WAIVED: 'warning',
};

const gateStatusIcons: Record<GateStatus, React.ReactNode> = {
  PENDING: <Clock size={10} />,
  EVALUATING: <Loader2 size={10} className="animate-spin" />,
  PASSED: <CheckCircle2 size={10} />,
  FAILED: <XCircle size={10} />,
  WAIVED: <AlertTriangle size={10} />,
};

// ─── Evidence matcher ───────────────────────────────────────

/** Find the card evidence that matches a gate requirement by name */
function matchEvidence(
  req: GateRequirement,
  evidenceMap: Map<string, CardEvidence>
): CardEvidence | undefined {
  return evidenceMap.get(req.name);
}

// ─── Requirement row ────────────────────────────────────────

function RequirementRow({
  req,
  evidence,
  compact,
}: {
  req: GateRequirement;
  evidence?: CardEvidence;
  compact: boolean;
}) {
  const icon = req.satisfied ? (
    <CheckCircle2 size={compact ? 10 : 12} className="text-green-600 flex-shrink-0" />
  ) : (
    <XCircle size={compact ? 10 : 12} className="text-red-500 flex-shrink-0" />
  );

  return (
    <div className={`flex items-start gap-1.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {icon}
      <div className="min-w-0 flex-1">
        <span className="text-content-primary">{req.name}</span>
        {/* Show actual evidence value vs threshold when available */}
        {evidence && (
          <span className="text-content-muted ml-1 studio-mono">
            (actual: {Number.isInteger(evidence.value) ? evidence.value : evidence.value.toFixed(2)})
          </span>
        )}
        {!evidence && req.metric && (
          <span className="text-content-muted ml-1 studio-mono">
            ({req.metric.value} {req.metric.operator} {req.metric.threshold})
          </span>
        )}
        {!compact && req.description && (
          <p className="text-content-tertiary text-[10px] mt-0.5">{req.description}</p>
        )}
      </div>
    </div>
  );
}

// ─── Audit trail ────────────────────────────────────────────

function AuditTrail({ gate }: { gate: Gate }) {
  const entries: { time: string; label: string }[] = [];
  if (gate.created_at) entries.push({ time: gate.created_at, label: 'Created' });
  if (gate.evaluated_at) entries.push({ time: gate.evaluated_at, label: 'Evaluated by system' });
  if (gate.approved_at) entries.push({ time: gate.approved_at, label: 'Approved' });
  if (gate.rejected_at) entries.push({ time: gate.rejected_at, label: 'Rejected' });
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 space-y-0.5">
      <span className="text-[9px] text-content-muted uppercase tracking-wider font-medium">
        History
      </span>
      {entries.map((e, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[10px] text-content-tertiary">
          <Clock size={8} className="flex-shrink-0" />
          <span className="studio-mono">{new Date(e.time).toLocaleString()}</span>
          <span>— {e.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Reject/Waive dialog (inline) ──────────────────────────

function ReasonDialog({
  title,
  onSubmit,
  onCancel,
  isLoading,
}: {
  title: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="mt-2 space-y-2 p-2 border border-surface-border bg-surface-bg">
      <label className="text-[10px] font-medium text-content-secondary">{title}</label>
      <textarea
        className="w-full text-xs p-1.5 border border-surface-border bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Enter reason..."
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={() => onSubmit(reason)}
          disabled={!reason.trim() || isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : 'Submit'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ─── Single gate card ───────────────────────────────────────

function GateCard({
  gate,
  evidenceMap,
  compact,
}: {
  gate: Gate;
  evidenceMap: Map<string, CardEvidence>;
  compact: boolean;
}) {
  const [expanded, setExpanded] = useState(!compact);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [waiveOpen, setWaiveOpen] = useState(false);

  const evaluateMut = useEvaluateGate();
  const approveMut = useApproveGate();
  const rejectMut = useRejectGate();
  const waiveMut = useWaiveGate();

  const satisfiedCount = gate.requirements.filter((r) => r.satisfied).length;
  const totalCount = gate.requirements.length;
  const isManual = gate.type !== 'evidence';
  const canAct = gate.status === 'PENDING' || gate.status === 'FAILED';

  const handleReject = useCallback(
    (rationale: string) => {
      rejectMut.mutate({ gateId: gate.id, rationale }, { onSuccess: () => setRejectOpen(false) });
    },
    [rejectMut, gate.id]
  );

  const handleWaive = useCallback(
    (rationale: string) => {
      waiveMut.mutate({ gateId: gate.id, rationale }, { onSuccess: () => setWaiveOpen(false) });
    },
    [waiveMut, gate.id]
  );

  return (
    <div className="border border-surface-border overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-bg hover:bg-surface-hover text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className={`flex-1 font-medium text-content-primary ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {gate.name}
        </span>
        <Badge variant={gateStatusVariants[gate.status]} className="text-[9px]">
          <span className="flex items-center gap-0.5">
            {gateStatusIcons[gate.status]}
            {gate.status}
          </span>
        </Badge>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-3 py-2 space-y-2">
          {/* Type + satisfaction count */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-content-muted">
              Type: {gate.type} ({isManual ? 'manual' : 'auto-evaluate'})
            </span>
            {totalCount > 0 && (
              <span className="text-[10px] text-content-muted studio-mono">
                {satisfiedCount}/{totalCount} met
              </span>
            )}
          </div>

          {/* Requirements */}
          {gate.requirements.length > 0 && (
            <div className="space-y-1">
              {gate.requirements.map((req) => (
                <RequirementRow
                  key={req.id}
                  req={req}
                  evidence={matchEvidence(req, evidenceMap)}
                  compact={compact}
                />
              ))}
            </div>
          )}

          {/* Audit trail (non-compact) */}
          {!compact && <AuditTrail gate={gate} />}

          {/* Action buttons */}
          {canAct && !compact && (
            <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
              {gate.type === 'evidence' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => evaluateMut.mutate(gate.id)}
                  disabled={evaluateMut.isPending}
                >
                  {evaluateMut.isPending ? <Spinner size="sm" /> : 'Evaluate'}
                </Button>
              )}
              {isManual && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => approveMut.mutate({ gateId: gate.id })}
                  disabled={approveMut.isPending}
                >
                  {approveMut.isPending ? <Spinner size="sm" /> : 'Approve'}
                </Button>
              )}
              {isManual && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRejectOpen(!rejectOpen)}
                >
                  Reject
                </Button>
              )}
              {gate.status !== 'WAIVED' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setWaiveOpen(!waiveOpen)}
                >
                  Waive
                </Button>
              )}
            </div>
          )}

          {/* Reject dialog */}
          {rejectOpen && (
            <ReasonDialog
              title="Rejection reason"
              onSubmit={handleReject}
              onCancel={() => setRejectOpen(false)}
              isLoading={rejectMut.isPending}
            />
          )}

          {/* Waive dialog */}
          {waiveOpen && (
            <ReasonDialog
              title="Waiver justification"
              onSubmit={handleWaive}
              onCancel={() => setWaiveOpen(false)}
              isLoading={waiveMut.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

const GateStatusPanel: React.FC<GateStatusPanelProps> = ({
  cardId,
  boardId,
  evidence,
  compact = false,
}) => {
  const { data: gates, isLoading } = useGates(boardId);

  // Build evidence lookup by criterion name
  const evidenceMap = React.useMemo(() => {
    if (!evidence) return new Map<string, CardEvidence>();
    return new Map(evidence.map((e) => [e.criterion, e]));
  }, [evidence]);

  // Filter gates that have requirements matching this card's evidence
  // If no evidence, show all gates (user still benefits from seeing gate status)
  const relevantGates = React.useMemo(() => {
    if (!gates) return [];
    if (evidenceMap.size === 0) return gates;
    return gates.filter((gate) =>
      gate.requirements.some((req) => evidenceMap.has(req.name)) ||
      gate.type !== 'evidence' // manual gates always relevant
    );
  }, [gates, evidenceMap]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (relevantGates.length === 0) {
    return (
      <p className={`text-content-tertiary ${compact ? 'text-[10px]' : 'text-sm'} py-2`}>
        No gates configured for this card.
      </p>
    );
  }

  // Summary counts
  const passedCount = relevantGates.filter((g) => g.status === 'PASSED').length;
  const failedCount = relevantGates.filter((g) => g.status === 'FAILED').length;
  const totalCount = relevantGates.length;

  return (
    <div className="space-y-2">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={compact ? 12 : 14} className="text-content-muted" />
          <span className={`font-medium text-content-secondary ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {passedCount}/{totalCount} gates passed
          </span>
        </div>
        {failedCount > 0 && (
          <Badge variant="danger" className="text-[9px]">
            {failedCount} failed
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-surface-bg border border-surface-border overflow-hidden">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Gate cards */}
      <div className="space-y-1.5">
        {relevantGates.map((gate) => (
          <GateCard
            key={gate.id}
            gate={gate}
            evidenceMap={evidenceMap}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

GateStatusPanel.displayName = 'GateStatusPanel';

export default GateStatusPanel;
