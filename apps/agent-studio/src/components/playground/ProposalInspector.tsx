import React from 'react';
import { cn, Button, Badge } from '@airaie/ui';
import { Check, X } from 'lucide-react';
import { formatCost } from '@airaie/ui';
import type { ActionProposal } from '@airaie/shared';
import { usePlaygroundStore } from '@store/playgroundStore';
import { useUIStore } from '@store/uiStore';
import { useApproveAction } from '@hooks/useSessions';
import ProposalActionCard from './ProposalActionCard';

export interface ProposalInspectorProps {
  selectedProposalId: string | null;
  className?: string;
}

const ProposalInspector: React.FC<ProposalInspectorProps> = ({ selectedProposalId, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const proposals = usePlaygroundStore((s) => s.proposals);
  const activeSessionId = usePlaygroundStore((s) => s.activeSessionId);
  const proposal = proposals.find((p) => p.id === selectedProposalId);
  const approveAction = useApproveAction();

  const handleApproveAll = async () => {
    if (!activeSessionId || !proposal) return;
    for (const action of proposal.actions) {
      await approveAction.mutateAsync({ agentId, sessionId: activeSessionId, actionId: action.action_id, decision: 'approve' });
    }
  };

  const handleReject = async () => {
    if (!activeSessionId || !proposal) return;
    for (const action of proposal.actions) {
      await approveAction.mutateAsync({ agentId, sessionId: activeSessionId, actionId: action.action_id, decision: 'reject' });
    }
  };

  if (!proposal) {
    return (
      <div className={cn('flex items-center justify-center h-full text-sm text-content-muted p-4', className)}>
        Select a proposal to inspect.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-border bg-white space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-content-primary">Proposal</h3>
          <Badge variant="info" badgeStyle="outline">{proposal.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-content-tertiary">
          <span>Score: {proposal.total_score.toFixed(2)}</span>
          <span>Cost: {formatCost(proposal.estimated_cost)}</span>
        </div>
      </div>

      {/* Actions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
          Actions ({proposal.actions.length})
        </span>
        {proposal.actions
          .sort((a, b) => a.order - b.order)
          .map((action) => (
            <ProposalActionCard key={action.action_id} action={action} />
          ))}

        {/* Dependencies */}
        {proposal.dependencies && proposal.dependencies.length > 0 && (
          <div className="border-t border-surface-border pt-3 mt-3 space-y-1">
            <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
              Dependencies
            </span>
            <ul className="text-xs text-content-secondary space-y-1">
              {proposal.dependencies.map((dep) => (
                <li key={dep.action_id} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-content-muted rounded-full" />
                  {dep.action_id} &rarr; {dep.depends_on.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Constraints */}
        <div className="border-t border-surface-border pt-3 mt-3 space-y-1">
          <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
            Applied Constraints
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs text-content-secondary">
            <span>Tools: {proposal.constraints.tools_selected}/{proposal.constraints.max_tools_per_run}</span>
            <span>Budget: {formatCost(proposal.constraints.budget_used)}/{formatCost(proposal.constraints.budget_limit)}</span>
            <span>Timeout: {proposal.constraints.timeout_seconds}s</span>
            <span>Retries: {proposal.constraints.max_retries}</span>
          </div>
        </div>
      </div>

      {/* Approve/Reject footer */}
      {proposal.status === 'draft' && (
        <div className="px-4 py-3 border-t border-surface-border bg-white flex gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Check}
            className="flex-1"
            onClick={handleApproveAll}
            loading={approveAction.isPending}
          >
            Approve All
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={X}
            className="flex-1"
            onClick={handleReject}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
};

ProposalInspector.displayName = 'ProposalInspector';

export default ProposalInspector;
