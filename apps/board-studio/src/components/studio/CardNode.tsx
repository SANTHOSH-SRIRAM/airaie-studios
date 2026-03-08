// ============================================================
// CardNode — custom ReactFlow node for DAG view
// Vertical-aware: split accent bar, lucide icons, domain metrics
// ============================================================

import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Card, CardStatus, CardType } from '@/types/board';
import type { VerticalTheme, IntentCardConfig } from '@/types/vertical-registry';
import { VERTICAL_REGISTRY } from '@/constants/vertical-registry';
import { extractFieldValue, formatFieldValue } from '@hooks/useVerticalConfig';

export interface StudioCardNodeData {
  card: Card;
  selected?: boolean;
  verticalSlug?: string;
  [key: string]: unknown;
}

const statusColors: Record<CardStatus, string> = {
  draft: 'var(--status-pending)',
  ready: 'var(--status-running)',
  queued: 'var(--status-blocked)',
  running: 'var(--status-running)',
  completed: 'var(--status-completed)',
  failed: 'var(--status-failed)',
  blocked: 'var(--status-blocked)',
  skipped: 'var(--status-pending)',
};

/** CSS color values for vertical accents (can't use Tailwind in inline styles) */
const verticalAccentCssColors: Record<string, string> = {
  'blue-600': '#2563eb',
  'emerald-600': '#059669',
  'violet-600': '#7c3aed',
  'amber-600': '#d97706',
};

const statusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

function StudioCardNode({ data }: NodeProps) {
  const nodeData = data as unknown as StudioCardNodeData;
  const { card, selected, verticalSlug } = nodeData;

  // Resolve vertical config
  const entry = verticalSlug ? VERTICAL_REGISTRY[verticalSlug] : null;
  const theme: VerticalTheme | null = entry?.theme ?? null;
  const intentConfig: IntentCardConfig | null =
    card.intent_type && entry?.intentConfigs[card.intent_type]
      ? entry.intentConfigs[card.intent_type]
      : null;

  const kpiEntries = Object.entries(card.kpis ?? {});

  // Resolve icon
  const IconComponent = intentConfig?.icon ?? theme?.icon;

  // Vertical accent CSS color
  const verticalColor = theme ? verticalAccentCssColors[theme.accentColor] : null;

  return (
    <div
      className={`
        studio-card-node bg-white border relative
        ${selected ? 'border-blue-500 shadow-md' : 'border-surface-border'}
        ${card.status === 'running' ? 'studio-pulse-ring' : ''}
      `}
      style={{ width: 220, minHeight: 64 }}
    >
      {/* Split accent bar — vertical color on top, status color on bottom */}
      {verticalColor ? (
        <>
          <div
            className="absolute top-0 left-0 w-[3px]"
            style={{ backgroundColor: verticalColor, height: '50%' }}
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-[3px]"
            style={{ backgroundColor: statusColors[card.status], height: '50%' }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div
          className="absolute top-0 left-0 bottom-0 w-[3px]"
          style={{ backgroundColor: statusColors[card.status] }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="pl-3 pr-2.5 py-2 space-y-1.5">
        {/* Title row */}
        <div className="flex items-center gap-1.5">
          {IconComponent ? (
            <IconComponent
              size={12}
              className="flex-shrink-0"
              style={theme ? { color: verticalAccentCssColors[theme.accentColor] } : undefined}
              aria-label={intentConfig?.displayName ?? theme?.name ?? card.type}
            />
          ) : (
            <span className="text-xs flex-shrink-0">{'◆'}</span>
          )}
          <span className="text-xs font-medium text-content-primary truncate flex-1">
            {card.name}
          </span>
        </div>

        {/* Status badge + execution indicators */}
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariants[card.status]} className="text-[9px]" dot>
            {card.status}
          </Badge>
          {/* Progress % when running */}
          {card.status === 'running' && (card.cost_estimate != null || card.time_estimate) && (
            <span className="text-[9px] font-medium text-blue-600 studio-mono animate-pulse">
              ...
            </span>
          )}
          {/* Evidence dot */}
          {card.evidence_summary && card.evidence_summary.total > 0 && (
            <span
              className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                card.evidence_summary.failed > 0
                  ? 'bg-red-500'
                  : card.evidence_summary.warnings > 0
                    ? 'bg-amber-400'
                    : card.evidence_summary.passed === card.evidence_summary.total
                      ? 'bg-green-500'
                      : 'bg-slate-300'
              }`}
              title={`${card.evidence_summary.passed}/${card.evidence_summary.total} pass${
                card.evidence_summary.warnings > 0 ? ` · ${card.evidence_summary.warnings} warn` : ''
              }${card.evidence_summary.failed > 0 ? ` · ${card.evidence_summary.failed} fail` : ''}`}
            />
          )}
        </div>

        {/* Domain metric row from summaryFields, or fallback to KPIs */}
        {intentConfig?.summaryFields ? (
          <div className="flex items-center gap-2 text-[10px] text-content-muted studio-mono">
            {intentConfig.summaryFields.slice(0, 2).map((field) => {
              const value = extractFieldValue(card, field.key);
              if (value == null) return null;
              return (
                <span key={field.key}>
                  {field.label}: {formatFieldValue(value, field.format, field.unit)}
                </span>
              );
            })}
          </div>
        ) : kpiEntries.length > 0 ? (
          <div className="flex items-center gap-2 text-[10px] text-content-muted studio-mono">
            {kpiEntries.slice(0, 2).map(([key, val]) => (
              <span key={key}>{key}: {String(val)}</span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-white !border-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-white !border-2" />
    </div>
  );
}

StudioCardNode.displayName = 'StudioCardNode';

export default StudioCardNode;
export const studioNodeTypes = { studioCardNode: StudioCardNode };
