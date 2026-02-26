import React from 'react';
import { cn, Button } from '@airaie/ui';
import { Plus } from 'lucide-react';
import type { EscalationRule } from '@airaie/shared';
import { useSpecStore } from '@store/specStore';
import EscalationRuleRow from './EscalationRuleRow';

const approvalActions = ['write', 'delete', 'execute'] as const;

const PolicyEditor: React.FC<{ className?: string }> = ({ className }) => {
  const policy = useSpecStore((s) => s.policy);
  const setPolicy = useSpecStore((s) => s.setPolicy);

  const toggleApprovalAction = (action: string) => {
    const current = policy.require_approval_for;
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    setPolicy({ ...policy, require_approval_for: next });
  };

  const addEscalationRule = () => {
    const rule: EscalationRule = { condition: '', action: 'require_human_approval' };
    setPolicy({ ...policy, escalation_rules: [...policy.escalation_rules, rule] });
  };

  const updateEscalationRule = (index: number, updated: EscalationRule) => {
    const next = [...policy.escalation_rules];
    next[index] = updated;
    setPolicy({ ...policy, escalation_rules: next });
  };

  const removeEscalationRule = (index: number) => {
    setPolicy({
      ...policy,
      escalation_rules: policy.escalation_rules.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={cn('space-y-5', className)}>
      <label className="text-sm font-medium text-content-primary block">Policy</label>

      {/* Auto-approve threshold */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm text-content-secondary">Auto-approve Threshold</label>
          <span className="text-xs text-content-muted tabular-nums w-10 text-right">
            {policy.auto_approve_threshold.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={policy.auto_approve_threshold}
          onChange={(e) =>
            setPolicy({ ...policy, auto_approve_threshold: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 accent-[#3b5fa8] cursor-pointer"
        />
      </div>

      {/* Require approval for */}
      <div className="space-y-2">
        <label className="text-sm text-content-secondary block">Require Approval For</label>
        <div className="flex gap-3">
          {approvalActions.map((action) => (
            <label key={action} className="flex items-center gap-1.5 text-sm text-content-primary cursor-pointer">
              <input
                type="checkbox"
                checked={policy.require_approval_for.includes(action)}
                onChange={() => toggleApprovalAction(action)}
                className="w-4 h-4 accent-[#3b5fa8]"
              />
              <span className="capitalize">{action}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Escalation Rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm text-content-secondary">Escalation Rules</label>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addEscalationRule}>
            Add Rule
          </Button>
        </div>
        {policy.escalation_rules.length === 0 ? (
          <p className="text-sm text-content-muted py-2">No escalation rules defined.</p>
        ) : (
          <div className="space-y-2">
            {policy.escalation_rules.map((rule, i) => (
              <EscalationRuleRow
                key={i}
                rule={rule}
                onChange={(updated) => updateEscalationRule(i, updated)}
                onRemove={() => removeEscalationRule(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

PolicyEditor.displayName = 'PolicyEditor';

export default PolicyEditor;
