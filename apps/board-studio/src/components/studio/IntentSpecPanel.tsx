// ============================================================
// IntentSpecPanel — displays the linked IntentSpec for a card
// Shows goal, intent type, inputs, constraints, acceptance criteria
// ============================================================

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Spinner } from '@airaie/ui';
import { Target, FileInput, ShieldCheck, AlertTriangle } from 'lucide-react';
import apiClient from '@api/client';
import { KERNEL_ENDPOINTS } from '@/constants/api';

interface IntentInput {
  name: string;
  type: string;
  required: boolean;
  value?: unknown;
  artifact_ref?: string;
}

interface AcceptanceCriterion {
  id: string;
  metric: string;
  operator: string;
  threshold: number;
  unit?: string;
  description?: string;
}

interface IntentSpecData {
  id: string;
  board_id: string;
  card_id?: string;
  intent_type: string;
  version: number;
  goal: string;
  inputs: IntentInput[];
  constraints: Record<string, unknown>;
  acceptance_criteria: AcceptanceCriterion[];
  governance?: {
    level?: string;
    require_review?: boolean;
    approval_roles?: string[];
    audit_level?: string;
  };
  status: string;
  created_at: string;
}

export interface IntentSpecPanelProps {
  cardId: string;
  intentSpecId?: string;
  intentType?: string;
}

function useIntentSpec(intentSpecId: string | undefined) {
  return useQuery({
    queryKey: ['intent', intentSpecId],
    queryFn: async () => {
      const { data } = await apiClient.get<IntentSpecData>(
        KERNEL_ENDPOINTS.INTENTS.GET(intentSpecId!)
      );
      return data;
    },
    enabled: !!intentSpecId,
  });
}

const OPERATOR_LABELS: Record<string, string> = {
  gte: '\u2265',
  gt: '>',
  lte: '\u2264',
  lt: '<',
  eq: '=',
};

const IntentSpecPanel: React.FC<IntentSpecPanelProps> = ({
  intentSpecId,
  intentType,
}) => {
  const { data: intent, isLoading, error } = useIntentSpec(intentSpecId);

  if (!intentSpecId) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-content-muted">
        <AlertTriangle size={12} />
        <span>No IntentSpec linked. One will be auto-created when you generate a plan.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (error || !intent) {
    return (
      <div className="text-xs text-status-danger py-4">
        Failed to load IntentSpec.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="info" className="text-[9px]">
          {intent.intent_type || intentType || 'unknown'}
        </Badge>
        <Badge variant="neutral" className="text-[9px]">
          v{intent.version}
        </Badge>
        <Badge
          variant={intent.status === 'active' || intent.status === 'locked' ? 'success' : 'neutral'}
          className="text-[9px]"
        >
          {intent.status}
        </Badge>
      </div>

      {/* Goal */}
      <div>
        <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
          <Target size={10} />
          <span className="uppercase tracking-wider font-semibold">Goal</span>
        </div>
        <p className="text-xs text-content-primary">{intent.goal}</p>
      </div>

      {/* Inputs */}
      {intent.inputs && intent.inputs.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
            <FileInput size={10} />
            <span className="uppercase tracking-wider font-semibold">Inputs</span>
          </div>
          <div className="border border-surface-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-bg text-content-muted border-b border-surface-border">
                  <th className="text-left px-2 py-1.5 font-medium">Name</th>
                  <th className="text-left px-2 py-1.5 font-medium">Type</th>
                  <th className="text-center px-2 py-1.5 font-medium">Req</th>
                  <th className="text-left px-2 py-1.5 font-medium">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {intent.inputs.map((inp) => (
                  <tr key={inp.name}>
                    <td className="px-2 py-1.5 text-content-primary font-medium">{inp.name}</td>
                    <td className="px-2 py-1.5 text-content-muted">{inp.type}</td>
                    <td className="px-2 py-1.5 text-center">
                      {inp.required ? (
                        <span className="text-status-danger">*</span>
                      ) : (
                        <span className="text-content-muted">-</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5 text-content-secondary studio-mono">
                      {inp.artifact_ref || String(inp.value ?? '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      {intent.acceptance_criteria && intent.acceptance_criteria.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[10px] text-content-muted mb-1">
            <ShieldCheck size={10} />
            <span className="uppercase tracking-wider font-semibold">Acceptance Criteria</span>
          </div>
          <div className="space-y-1">
            {intent.acceptance_criteria.map((ac) => (
              <div
                key={ac.id}
                className="flex items-center gap-2 text-xs px-2 py-1.5 bg-surface-bg border border-surface-border"
              >
                <span className="text-content-primary font-medium flex-1">{ac.metric}</span>
                <span className="studio-mono text-content-secondary">
                  {OPERATOR_LABELS[ac.operator] ?? ac.operator} {ac.threshold}
                </span>
                {ac.unit && (
                  <span className="text-content-muted">{ac.unit}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints (if any) */}
      {intent.constraints && Object.keys(intent.constraints).length > 0 && (
        <div>
          <div className="text-[10px] text-content-muted mb-1 uppercase tracking-wider font-semibold">
            Constraints
          </div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(intent.constraints).map(([key, val]) => (
              <div key={key} className="text-xs px-2 py-1 bg-surface-bg border border-surface-border">
                <span className="text-content-muted">{key}:</span>{' '}
                <span className="text-content-primary studio-mono">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Governance */}
      {intent.governance && (
        <div className="flex items-center gap-2 text-[11px] text-content-muted">
          <span>Governance:</span>
          <Badge variant="neutral" className="text-[9px]">{intent.governance.level ?? 'light'}</Badge>
          {intent.governance.require_review && (
            <Badge variant="warning" className="text-[9px]">review required</Badge>
          )}
        </div>
      )}
    </div>
  );
};

IntentSpecPanel.displayName = 'IntentSpecPanel';

export default IntentSpecPanel;
