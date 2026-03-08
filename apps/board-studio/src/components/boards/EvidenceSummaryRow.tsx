// ============================================================
// EvidenceSummaryRow — unified row selecting visualization by type
// ============================================================

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { EvidenceMetricSchema } from '@/types/vertical-registry';
import type { CardEvidence } from '@api/cards';
import EvidenceGauge from './EvidenceGauge';
import EvidenceBar from './EvidenceBar';
import EvidenceSparkline from './EvidenceSparkline';

type ComparisonOperator = 'lt' | 'lte' | 'gt' | 'gte';

export interface EvidenceSummaryRowProps {
  metric: EvidenceMetricSchema;
  evidence?: CardEvidence;
  sparklineValues?: number[];
  compact?: boolean;
}

const EvidenceSummaryRow: React.FC<EvidenceSummaryRowProps> = ({
  metric,
  evidence,
  sparklineValues,
  compact = false,
}) => {
  const value = evidence?.value;
  const { min, max } = metric.typical_range;

  return (
    <div className={`flex items-center gap-2 ${compact ? 'py-0.5' : 'py-1'}`}>
      {/* Label */}
      <span className={`text-content-secondary flex-shrink-0 ${compact ? 'text-[10px] w-20' : 'text-xs w-28'} truncate`}>
        {metric.label}
      </span>

      {/* Visualization */}
      <div className="flex-1 min-w-0">
        {value == null ? (
          <span className="text-[10px] text-content-muted">—</span>
        ) : metric.visualization === 'gauge' ? (
          <EvidenceGauge
            value={value}
            min={min}
            max={max}
            threshold={evidence?.threshold}
            operator={evidence?.operator as ComparisonOperator | undefined}
            unit={metric.unit}
            size={compact ? 'sm' : 'md'}
          />
        ) : metric.visualization === 'bar' ? (
          <EvidenceBar
            value={value}
            min={min}
            max={max}
            threshold={evidence?.threshold}
            operator={evidence?.operator as ComparisonOperator | undefined}
            unit={metric.unit}
            compact={compact}
          />
        ) : metric.visualization === 'sparkline' && sparklineValues ? (
          <EvidenceSparkline
            values={sparklineValues}
            threshold={evidence?.threshold}
            operator={evidence?.operator as ComparisonOperator | undefined}
            width={compact ? 60 : 80}
            height={compact ? 18 : 24}
          />
        ) : (
          <span className="text-xs text-content-primary studio-mono">
            {Number.isInteger(value) ? value : value.toFixed(2)}
            {metric.unit && <span className="text-content-muted ml-0.5">{metric.unit}</span>}
          </span>
        )}
      </div>

      {/* Pass/fail indicator */}
      {evidence && (
        <div className="flex-shrink-0">
          {evidence.passed ? (
            <CheckCircle2 size={compact ? 10 : 12} className="text-green-600" />
          ) : (
            <XCircle size={compact ? 10 : 12} className="text-red-500" />
          )}
        </div>
      )}
    </div>
  );
};

EvidenceSummaryRow.displayName = 'EvidenceSummaryRow';

export default EvidenceSummaryRow;
