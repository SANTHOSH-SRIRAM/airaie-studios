// ============================================================
// ApprovalsPage — pending proposal queue with approve/reject
// ============================================================

import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button, Badge, Card, EmptyState, Spinner, JsonViewer, Select, formatRelativeTime } from '@airaie/ui';
import type { KernelApprovalRequest, ApprovalStatus } from '@airaie/shared';
import { useApprovals, useApproveRequest, useRejectRequest } from '@hooks/useApprovals';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'expired', label: 'Expired' },
];

const STATUS_BADGE_MAP: Record<ApprovalStatus, { variant: 'warning' | 'success' | 'danger' | 'info' | 'neutral'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
  escalated: { variant: 'info', label: 'Escalated' },
  expired: { variant: 'neutral', label: 'Expired' },
};

function ApprovalCard({ approval }: { approval: KernelApprovalRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  const badge = STATUS_BADGE_MAP[approval.status] ?? { variant: 'neutral' as const, label: approval.status };
  const isPending = approval.status === 'pending';
  const proposal = approval.proposal_json ?? {};

  return (
    <Card>
      <Card.Body className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" onClick={() => setExpanded(!expanded)} className="shrink-0">
              {expanded
                ? <ChevronDown size={14} className="text-content-muted" />
                : <ChevronRight size={14} className="text-content-muted" />}
            </button>
            <ShieldCheck size={16} className="text-brand-secondary shrink-0" />
            <span className="text-sm font-semibold text-content-primary truncate">
              {(proposal.summary as string) ?? `Approval ${approval.id.slice(0, 8)}`}
            </span>
          </div>
          <Badge variant={badge.variant} badgeStyle="outline">{badge.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-content-muted">
          <span className="font-mono">Run: {approval.run_id.slice(0, 12)}...</span>
          <span className="font-mono">Agent: {approval.agent_id.slice(0, 12)}...</span>
          <div className="flex items-center gap-1 ml-auto">
            <Clock size={12} />
            <span>{formatRelativeTime(approval.created_at)}</span>
          </div>
        </div>

        {approval.deadline && (
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle size={12} />
            <span>Deadline: {new Date(approval.deadline).toLocaleDateString()}</span>
          </div>
        )}

        {expanded && (
          <div className="space-y-4 pt-2 border-t border-surface-border">
            {/* Proposal detail */}
            <div>
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-2">Proposal</h4>
              <JsonViewer data={proposal} defaultExpandDepth={2} />
            </div>

            {/* Decision info */}
            {approval.decided_by && (
              <div className="text-xs text-content-secondary">
                <span className="font-medium">Decided by:</span> {approval.decided_by}
                {approval.decided_at && <> at {new Date(approval.decided_at).toLocaleString()}</>}
                {approval.rationale && <p className="mt-1 text-content-muted italic">"{approval.rationale}"</p>}
              </div>
            )}

            {/* Action buttons */}
            {isPending && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-content-secondary block mb-1">Comment (optional)</label>
                  <input
                    type="text"
                    value={approveComment}
                    onChange={(e) => setApproveComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-1.5 border border-surface-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-secondary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    icon={CheckCircle2}
                    size="sm"
                    onClick={() => approveMutation.mutate({ id: approval.id, comment: approveComment || undefined })}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (required)"
                      className="flex-1 px-3 py-1.5 border border-surface-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                    />
                    <Button
                      variant="outline"
                      icon={XCircle}
                      size="sm"
                      onClick={() => {
                        if (!rejectReason.trim()) return;
                        rejectMutation.mutate({ id: approval.id, reason: rejectReason });
                      }}
                      disabled={rejectMutation.isPending || !rejectReason.trim()}
                    >
                      {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: rawApprovals, isLoading, isError, refetch } = useApprovals(statusFilter || undefined);
  const approvals = Array.isArray(rawApprovals) ? rawApprovals : [];

  const pendingCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="p-6 space-y-6 min-h-full bg-grid">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">
            Approvals
            {pendingCount > 0 && (
              <Badge variant="warning" className="ml-2 align-middle">{pendingCount}</Badge>
            )}
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Review and decide on agent proposals that require human approval.
          </p>
        </div>
        <Select
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle size={32} className="text-status-danger" />
          <p className="text-sm text-content-secondary">Failed to load approvals.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      {!isLoading && !isError && approvals.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          heading="No approvals"
          description={statusFilter ? 'No approvals match the selected filter.' : 'When agents propose actions that exceed policy thresholds, they will appear here for review.'}
        />
      )}

      {!isLoading && !isError && approvals.length > 0 && (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}
