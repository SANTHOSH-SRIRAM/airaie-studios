// ============================================================
// GateList — Expandable gate list with requirements checklist
// ============================================================

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Card, Badge, Button, ProgressBar, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Gate, GateType, GateStatus, GateRequirement } from '@/types/board';
import { useGates, useEvaluateGate, useApproveGate, useRejectGate, useWaiveGate } from '@hooks/useGates';

export interface GateListProps {
  boardId: string;
}

// --- Badge variant helpers ---

function gateTypeBadgeVariant(type: GateType): BadgeVariant {
  const map: Record<GateType, BadgeVariant> = {
    evidence: 'info',
    review: 'warning',
    compliance: 'danger',
    manufacturing: 'warning',
    exception: 'neutral',
  };
  return map[type] ?? 'neutral';
}

function gateStatusBadgeVariant(status: GateStatus): BadgeVariant {
  const map: Record<GateStatus, BadgeVariant> = {
    PASSED: 'success',
    FAILED: 'danger',
    PENDING: 'neutral',
    WAIVED: 'neutral',
    EVALUATING: 'info',
  };
  return map[status] ?? 'neutral';
}

// --- Requirement row ---

function RequirementRow({ req }: { req: GateRequirement }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <div className="flex-shrink-0 mt-0.5">
        {req.satisfied ? (
          <Check size={14} className="text-green-600" />
        ) : (
          <X size={14} className="text-red-600" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-content-primary">
          {req.name}
        </div>
        {req.description && (
          <div className="text-xs text-content-tertiary">{req.description}</div>
        )}
        {req.metric && (
          <div className="text-xs font-mono text-content-secondary mt-0.5">
            <span className={req.satisfied ? 'text-green-600' : 'text-red-600'}>
              {req.metric.value}
            </span>
            {' '}
            {req.metric.operator}
            {' '}
            {req.metric.threshold}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Gate row ---

function GateRow({ gate }: { gate: Gate }) {
  const [expanded, setExpanded] = useState(false);
  const [waiveConfirm, setWaiveConfirm] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const evaluateMutation = useEvaluateGate();
  const approveMutation = useApproveGate();
  const rejectMutation = useRejectGate();
  const waiveMutation = useWaiveGate();

  const isAutoGate = gate.type === 'evidence';
  const canEvaluate = isAutoGate && (gate.status === 'PENDING' || gate.status === 'FAILED');

  const isReviewable =
    (gate.type === 'review' || gate.type === 'compliance') &&
    gate.status === 'PENDING';

  return (
    <Card>
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <ChevronDown size={16} className="text-content-muted flex-shrink-0" />
          ) : (
            <ChevronRight size={16} className="text-content-muted flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-content-primary truncate">
            {gate.name}
          </span>
          <Badge variant={gateTypeBadgeVariant(gate.type)} className="text-xs">
            {gate.type}
          </Badge>
        </div>
        <Badge
          variant={gateStatusBadgeVariant(gate.status)}
          badgeStyle={gate.status === 'WAIVED' ? 'outline' : 'filled'}
          dot
        >
          {gate.status}
        </Badge>
      </div>

      {/* Expandable body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-surface-border">
          {/* Requirements checklist */}
          {gate.requirements.length > 0 ? (
            <div className="mt-3 space-y-1">
              <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">
                Requirements
              </h4>
              {gate.requirements.map((req) => (
                <RequirementRow key={req.id} req={req} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-content-tertiary mt-3">
              No requirements defined.
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex items-center gap-2">
            {canEvaluate && (
              <Button
                variant="primary"
                size="sm"
                loading={evaluateMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  evaluateMutation.mutate(gate.id);
                }}
              >
                Evaluate
              </Button>
            )}
            {isReviewable && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  loading={approveMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    approveMutation.mutate({ gateId: gate.id });
                  }}
                >
                  Approve
                </Button>
                {!rejectMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRejectMode(true);
                    }}
                  >
                    Reject
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      placeholder="Reason..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="px-2 py-1 text-xs border border-surface-border bg-white outline-none focus:border-red-400 w-40"
                      autoFocus
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300"
                      loading={rejectMutation.isPending}
                      disabled={!rejectReason.trim()}
                      onClick={() => {
                        rejectMutation.mutate(
                          { gateId: gate.id, rationale: rejectReason.trim() },
                          { onSuccess: () => { setRejectMode(false); setRejectReason(''); } }
                        );
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setRejectMode(false); setRejectReason(''); }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
            {gate.status !== 'WAIVED' && gate.status !== 'PASSED' && (
              <>
                {waiveConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-content-tertiary">
                      Waive this gate?
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={waiveMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        waiveMutation.mutate({ gateId: gate.id, rationale: 'Waived by reviewer' });
                        setWaiveConfirm(false);
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWaiveConfirm(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWaiveConfirm(true);
                    }}
                  >
                    Waive
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// --- Main component ---

const GateList: React.FC<GateListProps> = ({ boardId }) => {
  const { data: gates, isLoading, error } = useGates(boardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center gap-2 text-status-danger">
            <ShieldAlert size={16} />
            <span className="text-sm">
              Failed to load gates:{' '}
              {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!gates || gates.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        heading="No gates configured"
        description="Gates will appear here once the board has governance requirements."
      />
    );
  }

  const passed = gates.filter((g) => g.status === 'PASSED').length;
  const total = gates.length;
  const percent = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-content-secondary font-medium">
            {passed}/{total} gates passed
          </span>
          <span className="text-content-muted">{percent}%</span>
        </div>
        <ProgressBar
          value={percent}
          color={percent === 100 ? 'bg-green-600' : 'bg-brand-secondary'}
        />
      </div>

      {/* Gate list */}
      <div className="space-y-2">
        {gates.map((gate) => (
          <GateRow key={gate.id} gate={gate} />
        ))}
      </div>
    </div>
  );
};

GateList.displayName = 'GateList';

export default GateList;
