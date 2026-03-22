// ============================================================
// CostSection -- Per-card cost display for properties panel
// Shows estimated vs actual cost with progress bar
// ============================================================

import React from 'react';
import type { Card } from '@/types/board';

// --- Props ---

interface CostSectionProps {
  card: Card;
}

// --- Cost formatting ---

function formatCost(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// --- Main component ---

export default function CostSection({ card }: CostSectionProps) {
  const { cost_estimate, actual_cost } = card;

  // No cost data at all
  if (cost_estimate == null && actual_cost == null) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
          Cost
        </h3>
        <p className="text-xs text-content-tertiary">Cost tracking not configured</p>
      </div>
    );
  }

  const hasActual = actual_cost != null;
  const ratio = cost_estimate && hasActual ? Math.min(100, (actual_cost / cost_estimate) * 100) : 0;
  const isOverBudget = cost_estimate != null && hasActual && actual_cost > cost_estimate;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
        Cost
      </h3>

      {/* Estimated row */}
      {cost_estimate != null && (
        <div className="flex justify-between text-xs">
          <span className="text-content-tertiary">Estimated</span>
          <span className="text-content-primary font-medium font-mono">
            {formatCost(cost_estimate)}
          </span>
        </div>
      )}

      {/* Actual row */}
      <div className="flex justify-between text-xs">
        <span className="text-content-tertiary">Actual</span>
        {hasActual ? (
          <span className="text-content-primary font-medium font-mono">
            {formatCost(actual_cost)}
          </span>
        ) : (
          <span className="text-content-muted italic">Pending</span>
        )}
      </div>

      {/* Progress bar */}
      {cost_estimate != null && (
        <div className="space-y-1">
          <div className="h-2 bg-surface-bg border border-surface-border rounded-sm relative overflow-hidden">
            <div
              data-testid="cost-progress-bar"
              className={`h-full transition-all duration-500 ${
                isOverBudget ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${ratio}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="text-[10px] text-amber-600 font-medium">Over budget</p>
          )}
        </div>
      )}
    </div>
  );
}
