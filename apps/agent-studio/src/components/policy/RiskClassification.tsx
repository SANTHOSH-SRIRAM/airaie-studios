import React from 'react';
import { cn, Badge } from '@airaie/ui';
import { ArrowRight } from 'lucide-react';

export interface RiskClassificationProps {
  rules: Array<{ condition: string; action: string }>;
  className?: string;
}

const RiskClassification: React.FC<RiskClassificationProps> = ({ rules, className }) => {
  if (rules.length === 0) {
    return (
      <p className={cn('text-sm text-content-muted py-2', className)}>
        No escalation rules defined.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {rules.map((rule, i) => (
        <div
          key={i}
          className="flex items-center gap-2 text-sm border border-slate-200 px-3 py-2"
        >
          <span className="text-content-primary flex-1">{rule.condition}</span>
          <ArrowRight className="h-3.5 w-3.5 text-content-muted shrink-0" />
          <Badge variant="neutral" badgeStyle="outline">{rule.action}</Badge>
        </div>
      ))}
    </div>
  );
};

RiskClassification.displayName = 'RiskClassification';

export default RiskClassification;
