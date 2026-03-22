// ============================================================
// GovernanceLayersPanel — three collapsible governance layer sections
// ============================================================

import React, { useState } from 'react';
import {
  Wrench,
  Shield,
  Scale,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type {
  GovernanceLayers,
  GovernanceVerdict,
  ToolContractGovernance,
  SandboxPolicy,
  PolicyEngineVerdict,
} from '@/types/governance';

interface GovernanceLayersPanelProps {
  cardId: string;
  boardId: string;
  layers?: GovernanceLayers;
}

const verdictVariant: Record<GovernanceVerdict, BadgeVariant> = {
  pass: 'success',
  warning: 'warning',
  block: 'danger',
};

const verdictLabel: Record<GovernanceVerdict, string> = {
  pass: 'Pass',
  warning: 'Warning',
  block: 'Block',
};

function BooleanIndicator({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {value ? (
        <CheckCircle2 size={13} className="text-green-600" />
      ) : (
        <XCircle size={13} className="text-red-500" />
      )}
      <span className="text-content-secondary">{label}</span>
    </div>
  );
}

function ToolContractSection({ data }: { data: ToolContractGovernance }) {
  const quotaPercent =
    data.quota_limit && data.quota_limit > 0
      ? Math.round(((data.quota_remaining ?? 0) / data.quota_limit) * 100)
      : null;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-4">
        <BooleanIndicator value={data.sandbox_enabled} label="Sandbox Enabled" />
        <BooleanIndicator value={data.audit_logging} label="Audit Logging" />
      </div>

      {quotaPercent !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-content-tertiary">
            <span>Quota</span>
            <span>
              {data.quota_remaining ?? 0} / {data.quota_limit} remaining
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                quotaPercent > 50
                  ? 'bg-green-500'
                  : quotaPercent > 20
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>
      )}

      {data.details.length > 0 && (
        <ul className="space-y-1">
          {data.details.map((detail, i) => (
            <li key={i} className="text-xs text-content-tertiary">
              {detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SandboxPolicySection({ data }: { data: SandboxPolicy }) {
  const adapterEntries = Object.entries(data.adapter_limits);
  const resourceEntries = Object.entries(data.resource_limits);

  return (
    <div className="space-y-3 text-sm">
      {adapterEntries.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-content-secondary mb-1">
            Adapter Limits
          </h5>
          <div className="space-y-0.5">
            {adapterEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between text-xs text-content-tertiary"
              >
                <span className="font-mono">{key}</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {resourceEntries.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-content-secondary mb-1">
            Resource Limits
          </h5>
          <div className="space-y-0.5">
            {resourceEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between text-xs text-content-tertiary"
              >
                <span className="font-mono">{key}</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.details.length > 0 && (
        <ul className="space-y-1">
          {data.details.map((detail, i) => (
            <li key={i} className="text-xs text-content-tertiary">
              {detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PolicyEngineSection({ data }: { data: PolicyEngineVerdict }) {
  const decisionColor =
    data.decision === 'auto-approve'
      ? 'text-green-600'
      : data.decision === 'needs-approval'
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="space-y-3 text-sm">
      <div className={`text-xs font-semibold ${decisionColor}`}>
        {data.decision === 'auto-approve'
          ? 'Auto-Approve'
          : data.decision === 'needs-approval'
            ? 'Needs Approval'
            : 'Blocked'}
      </div>

      {data.rationale && (
        <p className="text-xs text-content-secondary leading-relaxed">
          {data.rationale}
        </p>
      )}

      {data.policy_refs.length > 0 && (
        <ul className="space-y-1">
          {data.policy_refs.map((ref, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-content-tertiary">
              <BookOpen size={11} className="flex-shrink-0" />
              {ref}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  icon: React.ElementType;
  title: string;
  verdict: GovernanceVerdict;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isLast?: boolean;
}

function CollapsibleSection({
  icon: Icon,
  title,
  verdict,
  expanded,
  onToggle,
  children,
  isLast = false,
}: CollapsibleSectionProps) {
  return (
    <div className={isLast ? '' : 'border-b border-surface-border'}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown size={14} className="text-content-tertiary" />
          ) : (
            <ChevronRight size={14} className="text-content-tertiary" />
          )}
          <Icon size={14} className="text-content-secondary" />
          <span className="text-sm font-medium text-content-primary">{title}</span>
        </div>
        <Badge variant={verdictVariant[verdict]}>{verdictLabel[verdict]}</Badge>
      </button>
      {expanded && <div className="px-1 pb-3">{children}</div>}
    </div>
  );
}

export default function GovernanceLayersPanel({
  cardId,
  boardId,
  layers,
}: GovernanceLayersPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tool_contract: false,
    sandbox_policy: false,
    policy_engine: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!layers) {
    return (
      <div className="text-sm text-content-tertiary text-center py-4">
        Governance layer data not available for this card.
      </div>
    );
  }

  return (
    <div>
      <CollapsibleSection
        icon={Wrench}
        title="Tool Contract"
        verdict={layers.tool_contract.verdict}
        expanded={expandedSections.tool_contract}
        onToggle={() => toggleSection('tool_contract')}
      >
        <ToolContractSection data={layers.tool_contract} />
      </CollapsibleSection>

      <CollapsibleSection
        icon={Shield}
        title="Sandbox Policy"
        verdict={layers.sandbox_policy.verdict}
        expanded={expandedSections.sandbox_policy}
        onToggle={() => toggleSection('sandbox_policy')}
      >
        <SandboxPolicySection data={layers.sandbox_policy} />
      </CollapsibleSection>

      <CollapsibleSection
        icon={Scale}
        title="Policy Engine"
        verdict={layers.policy_engine.verdict}
        expanded={expandedSections.policy_engine}
        onToggle={() => toggleSection('policy_engine')}
        isLast
      >
        <PolicyEngineSection data={layers.policy_engine} />
      </CollapsibleSection>
    </div>
  );
}
