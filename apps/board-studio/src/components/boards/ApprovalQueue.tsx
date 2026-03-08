// ============================================================
// ApprovalQueue — Pending gates with inline approve/reject
// ============================================================

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Inbox,
  UserPlus,
  ArrowUpCircle,
} from 'lucide-react';
import { Card, Badge, Button, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Gate, GateType, GateRequirement } from '@/types/board';
import { usePendingApprovals } from '@hooks/useApprovals';
import { useApproveGate, useRejectGate } from '@hooks/useGates';

export interface ApprovalQueueProps {
  /** If provided, only shows pending gates for this board */
  boardId?: string;
  /** If provided, filter to only this gate type */
  gateTypeFilter?: string;
}

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

// --- Single approval item ---

function ApprovalItem({
  gate,
  showBoardName,
}: {
  gate: Gate & { _boardName?: string };
  showBoardName: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [delegateMode, setDelegateMode] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState('');
  const [delegateMessage, setDelegateMessage] = useState<string | null>(null);
  const [escalateMessage, setEscalateMessage] = useState<string | null>(null);
  const approveMutation = useApproveGate();
  const rejectMutation = useRejectGate();

  return (
    <Card>
      <div className="px-4 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              className="flex-shrink-0 text-content-muted hover:text-content-primary"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div className="min-w-0">
              {showBoardName && gate._boardName && (
                <div className="text-xs text-content-tertiary truncate">
                  {gate._boardName}
                </div>
              )}
              <div className="text-sm font-medium text-content-primary truncate">
                {gate.name}
              </div>
            </div>
            <Badge
              variant={gateTypeBadgeVariant(gate.type)}
              className="text-xs flex-shrink-0"
            >
              {gate.type}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate({ gateId: gate.id })}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={XCircle}
              className="text-red-600 border-red-300 hover:bg-red-50"
              loading={rejectMutation.isPending}
              onClick={() => setRejectMode((v) => !v)}
            >
              Reject
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={UserPlus}
              onClick={() => setDelegateMode((v) => !v)}
            >
              Delegate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowUpCircle}
              onClick={() => {
                setEscalateMessage(`Gate "${gate.name}" escalated for higher-level review`);
                setTimeout(() => setEscalateMessage(null), 3000);
              }}
            >
              Escalate
            </Button>
          </div>
        </div>

        {/* Escalate confirmation */}
        {escalateMessage && (
          <div className="mt-2 pl-6 text-xs text-amber-600 font-medium">
            {escalateMessage}
          </div>
        )}

        {/* Delegate input */}
        {delegateMode && (
          <div className="mt-3 pl-6 space-y-2">
            <input
              type="text"
              className="w-full px-3 py-2 text-sm bg-white border border-surface-border rounded-none text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary"
              placeholder="Delegate email or name..."
              value={delegateTarget}
              onChange={(e) => setDelegateTarget(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                disabled={!delegateTarget.trim()}
                onClick={() => {
                  setDelegateMessage(`Delegation sent to ${delegateTarget.trim()}`);
                  setDelegateMode(false);
                  setDelegateTarget('');
                  setTimeout(() => setDelegateMessage(null), 3000);
                }}
              >
                Send Delegation
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDelegateMode(false); setDelegateTarget(''); }}
              >
                Cancel
              </Button>
            </div>
            {delegateMessage && (
              <div className="text-xs text-green-600 font-medium">{delegateMessage}</div>
            )}
          </div>
        )}

        {/* Delegate success shown outside delegate mode */}
        {!delegateMode && delegateMessage && (
          <div className="mt-2 pl-6 text-xs text-green-600 font-medium">
            {delegateMessage}
          </div>
        )}

        {/* Reject reason input */}
        {rejectMode && (
          <div className="mt-3 pl-6 space-y-2">
            <textarea
              className="w-full h-20 px-3 py-2 text-sm bg-white border border-surface-border rounded-none text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
              placeholder="Rejection reason (required)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                disabled={!rejectReason.trim()}
                loading={rejectMutation.isPending}
                onClick={() => {
                  rejectMutation.mutate({
                    gateId: gate.id,
                    rationale: rejectReason.trim(),
                  });
                  setRejectMode(false);
                  setRejectReason('');
                }}
              >
                Confirm Reject
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectMode(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Expanded requirements */}
        {expanded && gate.requirements.length > 0 && (
          <div className="mt-3 pl-6 space-y-1">
            <h4 className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">
              Requirements needing review
            </h4>
            {gate.requirements.map((req: GateRequirement) => (
              <div key={req.id} className="flex items-center gap-2 text-sm py-1">
                <span
                  className={
                    req.satisfied ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {req.satisfied ? '\u2713' : '\u2717'}
                </span>
                <span className="text-content-primary">{req.name}</span>
                {req.metric && (
                  <span className="text-xs font-mono text-content-tertiary">
                    ({req.metric.value} {req.metric.operator} {req.metric.threshold})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// --- Main component ---

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ boardId, gateTypeFilter }) => {
  const { data: rawPendingGates, isLoading, error } = usePendingApprovals(boardId);
  const approveMutation = useApproveGate();
  const showBoardName = !boardId; // Show board name when viewing across all boards

  // Apply gate type filter
  const pendingGates = React.useMemo(() => {
    if (!rawPendingGates) return rawPendingGates;
    if (!gateTypeFilter) return rawPendingGates;
    return rawPendingGates.filter((g) => g.type === gateTypeFilter);
  }, [rawPendingGates, gateTypeFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <div className="text-sm text-status-danger">
            Failed to load pending approvals:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (!pendingGates || pendingGates.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        heading="No pending approvals"
        description="All gates have been reviewed. New approvals will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk actions */}
      {pendingGates.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-content-secondary">
            {pendingGates.length} pending approval{pendingGates.length > 1 ? 's' : ''}
          </span>
          <Button
            variant="primary"
            size="sm"
            loading={approveMutation.isPending}
            onClick={() => {
              pendingGates.forEach((g) => {
                approveMutation.mutate({ gateId: g.id });
              });
            }}
          >
            Approve All
          </Button>
        </div>
      )}

      {/* Gate list */}
      {pendingGates.map((gate) => (
        <ApprovalItem
          key={gate.id}
          gate={gate}
          showBoardName={showBoardName}
        />
      ))}
    </div>
  );
};

ApprovalQueue.displayName = 'ApprovalQueue';

export default ApprovalQueue;
