// ============================================================
// PreflightResults — Preflight validation results display
// ============================================================

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Play } from 'lucide-react';
import { Card, Badge, Button, Spinner, Tooltip } from '@airaie/ui';
import { usePlan, useValidatePlan } from '@hooks/usePlan';
import type { ValidatorResult } from '@api/plans';

export interface PreflightResultsProps {
  cardId: string | undefined;
}

// --- Validator result row ---

function ValidatorRow({ result }: { result: ValidatorResult }) {
  const passed = result.status === 'pass';

  return (
    <div className="flex items-start gap-2 py-2 border-b border-surface-border last:border-0">
      {/* Status icon */}
      {passed ? (
        <CheckCircle2 size={16} className="text-green-600 mt-0.5 shrink-0" />
      ) : (
        <XCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
      )}

      {/* Validator details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-content-primary font-medium">
          {result.name}
        </div>

        {/* Error message for failed validators */}
        {!passed && result.message && (
          <div className="text-xs text-status-danger mt-0.5">
            {result.message}
          </div>
        )}

        {/* Auto-fix suggestion */}
        {!passed && result.auto_fix && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-content-muted italic">
              Suggested fix: {result.auto_fix}
            </span>
            <Tooltip content="Coming soon" side="top">
              <Button variant="ghost" size="sm" disabled className="text-[10px] h-5 px-1.5">
                Apply Fix
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main component ---

const PreflightResults: React.FC<PreflightResultsProps> = ({ cardId }) => {
  const { data: plan, isLoading } = usePlan(cardId);
  const validatePlan = useValidatePlan(cardId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!plan) return null;

  const preflight = plan.preflight_result;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content-primary">
          Preflight Validation
        </h3>

        {/* Run preflight button if no results yet */}
        {!preflight && (
          <Button
            variant="secondary"
            size="sm"
            icon={Play}
            onClick={() => validatePlan.mutate()}
            loading={validatePlan.isPending}
            disabled={!cardId}
          >
            Run Preflight
          </Button>
        )}
      </div>

      {/* Loading validation */}
      {validatePlan.isPending && (
        <Card>
          <Card.Body>
            <div className="flex items-center gap-2 text-sm text-content-secondary">
              <Spinner size="sm" />
              Running preflight validation...
            </div>
          </Card.Body>
        </Card>
      )}

      {/* No preflight results */}
      {!preflight && !validatePlan.isPending && (
        <Card>
          <Card.Body>
            <p className="text-sm text-content-tertiary text-center py-2">
              No preflight validation has been run yet.
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Preflight results */}
      {preflight && (
        <Card>
          <Card.Body>
            {/* Overall status */}
            <div className="flex items-center gap-2 mb-3">
              {preflight.status === 'pass' ? (
                <>
                  <CheckCircle2 size={20} className="text-green-600" />
                  <Badge variant="success" className="text-xs">PASS</Badge>
                </>
              ) : (
                <>
                  <AlertTriangle size={20} className="text-red-600" />
                  <Badge variant="danger" className="text-xs">FAIL</Badge>
                </>
              )}
            </div>

            {/* Per-validator results */}
            <div className="divide-y divide-surface-border">
              {preflight.validators.map((v, i) => (
                <ValidatorRow key={i} result={v} />
              ))}
            </div>

            {/* Summary counts */}
            <div className="mt-3 pt-2 border-t border-surface-border">
              <span className="text-xs text-content-muted">
                {preflight.validators.filter((v) => v.status === 'pass').length}/
                {preflight.validators.length} validators passed
              </span>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

PreflightResults.displayName = 'PreflightResults';

export default PreflightResults;
