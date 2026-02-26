import React from 'react';
import { cn } from '@airaie/ui';
import { Trash2 } from 'lucide-react';
import type { EscalationRule, EscalationAction } from '@airaie/shared';

const actionOptions: { value: EscalationAction; label: string }[] = [
  { value: 'require_human_approval', label: 'Require Approval' },
  { value: 'block', label: 'Block' },
];

export interface EscalationRuleRowProps {
  rule: EscalationRule;
  onChange: (updated: EscalationRule) => void;
  onRemove: () => void;
}

const EscalationRuleRow: React.FC<EscalationRuleRowProps> = ({ rule, onChange, onRemove }) => {
  return (
    <div className="flex items-start gap-2">
      <input
        type="text"
        value={rule.condition}
        onChange={(e) => onChange({ ...rule, condition: e.target.value })}
        placeholder="Condition expression"
        className={cn(
          'flex-1 h-8 px-2 text-sm bg-white border border-surface-border rounded-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary placeholder:text-content-muted'
        )}
      />
      <select
        value={rule.action}
        onChange={(e) => onChange({ ...rule, action: e.target.value as EscalationAction })}
        className={cn(
          'w-40 h-8 px-2 text-sm bg-white border border-surface-border rounded-none appearance-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary'
        )}
      >
        {actionOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={onRemove}
        className="p-1.5 text-content-muted hover:text-status-danger transition-colors flex-shrink-0"
        title="Remove rule"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

EscalationRuleRow.displayName = 'EscalationRuleRow';

export default EscalationRuleRow;
