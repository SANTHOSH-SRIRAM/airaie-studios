import React, { useState } from 'react';
import { cn, Button, Badge, StatusBadge, Spinner, Input } from '@airaie/ui';
import { ArrowLeft, Play, Check, X, AlertTriangle } from 'lucide-react';
import { formatRelativeTime } from '@airaie/ui';
import type { KernelGate } from '@airaie/shared';
import { useGate, useGateRequirements, useGateApprovals, useApproveGate, useRejectGate, useWaiveGate } from '@hooks/useGates';
import * as gatesApi from '@api/gates';
import GateRequirementRow from './GateRequirementRow';
import ApprovalHistoryItem from './ApprovalHistoryItem';

const gateStatusMap: Record<string, string> = {
  PENDING: 'pending', EVALUATING: 'running', PASSED: 'completed', FAILED: 'failed', WAIVED: 'cancelled',
};

export interface GateDetailProps {
  gateId: string;
  onBack: () => void;
  className?: string;
}

const GateDetail: React.FC<GateDetailProps> = ({ gateId, onBack, className }) => {
  const { data: gate, isLoading: gateLoading } = useGate(gateId);
  const { data: requirements } = useGateRequirements(gateId);
  const { data: approvals } = useGateApprovals(gateId);
  const approveGate = useApproveGate();
  const rejectGate = useRejectGate();
  const waiveGate = useWaiveGate();
  const [rationale, setRationale] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try { await gatesApi.evaluateGate(gateId); } finally { setEvaluating(false); }
  };

  if (gateLoading || !gate) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const isPending = gate.status === 'PENDING' || gate.status === 'EVALUATING';

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-white space-y-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-content-muted hover:text-content-primary"><ArrowLeft size={16} /></button>
          <h3 className="text-sm font-semibold text-content-primary">{gate.name}</h3>
          <StatusBadge status={(gateStatusMap[gate.status] || 'pending') as any} />
          <Badge variant="neutral" badgeStyle="outline">{gate.gate_type}</Badge>
        </div>
        {gate.description && <p className="text-xs text-content-secondary">{gate.description}</p>}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Requirements */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            Requirements ({requirements?.length || 0})
          </span>
          {requirements && requirements.length > 0 ? (
            <div className="space-y-2">
              {requirements.map((req) => <GateRequirementRow key={req.id} requirement={req} />)}
            </div>
          ) : (
            <p className="text-xs text-content-muted">No requirements defined.</p>
          )}
        </div>

        {/* Approval History */}
        <div className="space-y-2 border-t border-surface-border pt-4">
          <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            Approval History ({approvals?.length || 0})
          </span>
          {approvals && approvals.length > 0 ? (
            <div className="space-y-2">
              {approvals.map((a) => <ApprovalHistoryItem key={a.id} approval={a} />)}
            </div>
          ) : (
            <p className="text-xs text-content-muted">No approval actions yet.</p>
          )}
        </div>
      </div>

      {/* Action footer */}
      {isPending && (
        <div className="px-4 py-3 border-t border-surface-border bg-white space-y-2">
          <Input
            placeholder="Rationale (optional)..."
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={Play} onClick={handleEvaluate} loading={evaluating}>Evaluate</Button>
            <Button variant="primary" size="sm" icon={Check} onClick={() => approveGate.mutate({ id: gateId, rationale })} loading={approveGate.isPending}>Approve</Button>
            <Button variant="outline" size="sm" icon={X} onClick={() => rejectGate.mutate({ id: gateId, rationale })} loading={rejectGate.isPending}>Reject</Button>
            <Button variant="ghost" size="sm" icon={AlertTriangle} onClick={() => waiveGate.mutate({ id: gateId, rationale })} loading={waiveGate.isPending}>Waive</Button>
          </div>
        </div>
      )}
    </div>
  );
};

GateDetail.displayName = 'GateDetail';
export default GateDetail;
