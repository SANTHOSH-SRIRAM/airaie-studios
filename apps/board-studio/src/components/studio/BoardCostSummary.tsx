// ============================================================
// BoardCostSummary -- Board-level cost aggregation chart
// Shows total estimated vs actual and per-card breakdown
// ============================================================

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from '@airaie/charts';
import type { Card } from '@/types/board';

// --- Props ---

interface BoardCostSummaryProps {
  cards: Card[];
}

// --- Cost formatting ---

function formatCost(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// --- Main component ---

export default function BoardCostSummary({ cards }: BoardCostSummaryProps) {
  // Filter cards that have cost data
  const costCards = useMemo(
    () => cards.filter((c) => c.cost_estimate != null || c.actual_cost != null),
    [cards]
  );

  // Aggregate totals
  const totals = useMemo(() => {
    let estimated = 0;
    let actual = 0;
    for (const card of costCards) {
      estimated += card.cost_estimate ?? 0;
      actual += card.actual_cost ?? 0;
    }
    return { estimated, actual };
  }, [costCards]);

  // Build chart data grouped by tool slug or card name
  const chartData = useMemo(() => {
    return costCards.map((card) => ({
      name: card.selected_tool?.slug ?? card.name,
      estimated: card.cost_estimate ?? 0,
      actual: card.actual_cost ?? 0,
    }));
  }, [costCards]);

  if (costCards.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
          Cost Overview
        </h3>
        <p className="text-xs text-content-tertiary">No cost data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
        Cost Overview
      </h3>

      {/* Total summary row */}
      <div className="flex items-center justify-between text-xs border-b border-surface-border pb-2">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-content-tertiary">Estimated: </span>
            <span className="text-content-primary font-medium font-mono">
              {formatCost(totals.estimated)}
            </span>
          </div>
          <div>
            <span className="text-content-tertiary">Actual: </span>
            <span className="text-content-primary font-medium font-mono">
              {formatCost(totals.actual)}
            </span>
          </div>
        </div>
        {totals.actual > totals.estimated && totals.estimated > 0 && (
          <span className="text-[10px] text-amber-600 font-medium">
            +{(((totals.actual - totals.estimated) / totals.estimated) * 100).toFixed(0)}% over
          </span>
        )}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatCost(value),
              name === 'estimated' ? 'Estimated' : 'Actual',
            ]}
            contentStyle={{ fontSize: 11 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(value: string) => (value === 'estimated' ? 'Estimated' : 'Actual')}
          />
          <Bar dataKey="estimated" fill="#93c5fd" name="estimated" radius={[2, 2, 0, 0]} />
          <Bar dataKey="actual" fill="#3b82f6" name="actual" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
