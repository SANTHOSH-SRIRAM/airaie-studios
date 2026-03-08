// ============================================================
// CardSummaryZone — renders domain-specific summary fields
// ============================================================

import React from 'react';
import type { Card } from '@/types/board';
import type { CardFieldDefinition, EvidenceMetricSchema } from '@/types/vertical-registry';
import type { CardEvidence } from '@api/cards';
import { extractFieldValue, formatFieldValue } from '@hooks/useVerticalConfig';
import EvidenceSummaryRow from './EvidenceSummaryRow';

interface CardSummaryZoneProps {
  fields: CardFieldDefinition[];
  card: Card;
  compact?: boolean;
  evidenceMetrics?: EvidenceMetricSchema[];
  evidence?: CardEvidence[];
}

const CardSummaryZone: React.FC<CardSummaryZoneProps> = ({
  fields,
  card,
  compact,
  evidenceMetrics,
  evidence,
}) => {
  // ── Evidence-metric rows (when schema + evidence available) ──
  const hasEvidenceData = evidenceMetrics && evidenceMetrics.length > 0;
  const evidenceByKey = React.useMemo(() => {
    if (!evidence) return new Map<string, CardEvidence>();
    return new Map(evidence.map((e) => [e.criterion, e]));
  }, [evidence]);

  // ── Domain summary fields (existing fallback) ────────────────
  const visibleFields = fields.slice(0, compact ? 2 : 3);
  const renderedFields = visibleFields
    .map((field) => {
      const value = extractFieldValue(card, field.key);
      if (value == null) return null;
      return { field, formatted: formatFieldValue(value, field.format, field.unit) };
    })
    .filter(Boolean) as { field: CardFieldDefinition; formatted: string }[];

  if (!hasEvidenceData && renderedFields.length === 0) return null;

  return (
    <div role="list" aria-label="Card summary fields">
      {/* Evidence metric rows (rich visualizations) */}
      {hasEvidenceData && (
        <div className="space-y-0.5">
          {evidenceMetrics!.slice(0, compact ? 2 : 3).map((metric) => (
            <EvidenceSummaryRow
              key={metric.key}
              metric={metric}
              evidence={evidenceByKey.get(metric.key)}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* Plain domain fields (fallback / supplement) */}
      {renderedFields.length > 0 && (
        <div className={`flex items-center gap-2 flex-wrap ${hasEvidenceData ? 'mt-1 pt-1 border-t border-surface-border' : ''}`}>
          {renderedFields.map(({ field, formatted }) => (
            <div
              key={field.key}
              className="flex items-center gap-1 text-[10px] text-content-secondary"
              role="listitem"
            >
              {field.icon && (
                <field.icon size={10} className="text-content-muted flex-shrink-0" aria-hidden="true" />
              )}
              <span className="text-content-tertiary">{field.label}:</span>
              <span className="font-medium studio-mono">{formatted}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CardSummaryZone.displayName = 'CardSummaryZone';

export default CardSummaryZone;
