import React from 'react';
import { cn, Card } from '@airaie/ui';
import { useSpecStore } from '@store/specStore';
import { formatCost } from '@airaie/ui';
import ConfidenceSlider from './ConfidenceSlider';
import MandatoryValidations from './MandatoryValidations';
import RiskClassification from './RiskClassification';

const weightKeys = ['compatibility', 'trust', 'cost'] as const;

const PolicyOverview: React.FC<{ className?: string }> = ({ className }) => {
  const policy = useSpecStore((s) => s.policy);
  const scoring = useSpecStore((s) => s.scoring);
  const constraints = useSpecStore((s) => s.constraints);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Confidence Threshold */}
      <Card>
        <Card.Body>
          <label className="text-sm font-medium text-content-primary block mb-3">
            Confidence Threshold
          </label>
          <ConfidenceSlider threshold={policy.auto_approve_threshold} />
        </Card.Body>
      </Card>

      {/* Scoring Strategy */}
      <Card>
        <Card.Body>
          <label className="text-sm font-medium text-content-primary block mb-3">
            Scoring Strategy
          </label>
          <p className="text-sm text-content-secondary capitalize mb-2">{scoring.strategy}</p>
          <div className="space-y-2">
            {weightKeys.map((key) => {
              const pct = Math.min(scoring.weights[key] * 100, 100);
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-content-secondary capitalize">{key}</span>
                    <span className="text-xs text-content-muted tabular-nums">
                      {scoring.weights[key].toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 w-full">
                    <div
                      className="h-full bg-brand-secondary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Constraints */}
      <Card>
        <Card.Body>
          <label className="text-sm font-medium text-content-primary block mb-3">
            Constraints
          </label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-0.5">
              <span className="text-xs text-content-muted block">Max Tools / Run</span>
              <span className="text-content-primary font-medium tabular-nums">
                {constraints.max_tools_per_run}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-content-muted block">Timeout</span>
              <span className="text-content-primary font-medium tabular-nums">
                {constraints.timeout_seconds}s
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-content-muted block">Max Retries</span>
              <span className="text-content-primary font-medium tabular-nums">
                {constraints.max_retries}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-content-muted block">Budget Limit</span>
              <span className="text-content-primary font-medium tabular-nums">
                {formatCost(constraints.budget_limit)}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Mandatory Approvals */}
      <Card>
        <Card.Body>
          <label className="text-sm font-medium text-content-primary block mb-3">
            Mandatory Approvals
          </label>
          <MandatoryValidations operations={policy.require_approval_for} />
        </Card.Body>
      </Card>

      {/* Risk Classification */}
      <Card>
        <Card.Body>
          <label className="text-sm font-medium text-content-primary block mb-3">
            Risk Classification
          </label>
          <RiskClassification rules={policy.escalation_rules} />
        </Card.Body>
      </Card>
    </div>
  );
};

PolicyOverview.displayName = 'PolicyOverview';

export default PolicyOverview;
