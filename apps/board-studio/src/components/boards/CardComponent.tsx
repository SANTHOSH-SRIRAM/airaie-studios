// ============================================================
// CardComponent — individual card display for Kanban and graph views
// Vertical-aware: adapts accent, icons, and summary based on vertical
// ============================================================

import React from 'react';
import { Wrench, DollarSign, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Card, CardType, CardStatus, Board } from '@/types/board';
import type { VerticalTheme, IntentCardConfig, CardFacePreset } from '@/types/vertical-registry';
import { useVerticalConfig } from '@hooks/useVerticalConfig';
import CardSummaryZone from './CardSummaryZone';
import VerticalBadge from './VerticalBadge';

export type CardDensity = 'compact' | 'normal' | 'expanded';

export interface CardComponentProps {
  card: Card;
  board?: Board;
  onClick?: (card: Card) => void;
  compact?: boolean;
  density?: CardDensity;
}

const cardTypeVariants: Record<CardType, BadgeVariant> = {
  analysis: 'info',
  comparison: 'info',
  sweep: 'warning',
  agent: 'neutral',
  gate: 'success',
  milestone: 'neutral',
};

const cardStatusVariants: Record<CardStatus, BadgeVariant> = {
  draft: 'neutral',
  ready: 'info',
  queued: 'warning',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  blocked: 'warning',
  skipped: 'neutral',
};

/** Tailwind accent bar color classes keyed by vertical accent */
const accentBarColors: Record<string, string> = {
  'blue-600': 'bg-blue-600',
  'emerald-600': 'bg-emerald-600',
  'violet-600': 'bg-violet-600',
  'amber-600': 'bg-amber-600',
};

const statusBarColors: Record<CardStatus, string> = {
  draft: 'bg-gray-300',
  ready: 'bg-blue-400',
  queued: 'bg-amber-400',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  blocked: 'bg-amber-500',
  skipped: 'bg-gray-300',
};

/** Icon size pixels from preset */
const iconSizeMap = { sm: 11, md: 13, lg: 16 };

const CardComponent: React.FC<CardComponentProps> = ({ card, board, onClick, compact, density: densityProp }) => {
  const { theme, intentConfig } = useVerticalConfig(card, board);
  const kpiEntries = Object.entries(card.kpis ?? {});
  const depCount = card.dependencies?.length ?? 0;

  // Resolve density: explicit prop > compact fallback > normal
  const density: CardDensity = densityProp ?? (compact ? 'compact' : 'normal');
  const isCompact = density === 'compact';
  const isExpanded = density === 'expanded';

  // Card face preset from vertical theme
  const preset: CardFacePreset | undefined = theme?.cardFacePreset;

  // Resolve accent bar color: vertical accent if available, else status color
  const accentBarClass = theme
    ? accentBarColors[theme.accentColor] ?? statusBarColors[card.status]
    : statusBarColors[card.status];

  // Resolve icon: intent icon > vertical icon > null
  const IconComponent = intentConfig?.icon ?? theme?.icon;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(card);
        }
      }}
      className={`
        bg-white border border-surface-border p-3 cursor-pointer relative
        hover:shadow-card-hover transition-shadow duration-150
        ${isCompact ? 'space-y-1' : 'space-y-2'}
      `}
    >
      {/* Vertical accent bar — left edge */}
      <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${accentBarClass}`} />

      <div className="pl-1">
        {/* Card name with optional icon */}
        <div className="flex items-center gap-1.5">
          {IconComponent && (
            <IconComponent
              size={iconSizeMap[preset?.iconSize ?? 'md']}
              className={theme ? `text-${theme.accentText}` : 'text-content-muted'}
              aria-label={intentConfig?.displayName ?? theme?.name ?? card.type}
            />
          )}
          <div className="font-medium text-sm text-content-primary truncate flex-1">
            {card.name || card.title}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <Badge variant={cardTypeVariants[card.type]} className="text-[10px]">
            {intentConfig?.displayName ?? card.type}
          </Badge>
          <Badge variant={cardStatusVariants[card.status]} dot className="text-[10px]">
            {card.status}
          </Badge>
          {/* Vertical indicator */}
          {theme && !isCompact && <VerticalBadge theme={theme} />}
          {/* Readiness dot */}
          {card.evidence_summary && card.evidence_summary.total > 0 && (() => {
            const es = card.evidence_summary;
            const readiness = es.failed > 0 ? 'fail'
              : es.warnings > 0 ? 'warn'
              : es.passed === es.total ? 'pass' : 'pending';
            const dotColor = readiness === 'pass' ? 'bg-green-500'
              : readiness === 'warn' ? 'bg-amber-400'
              : readiness === 'fail' ? 'bg-red-500' : 'bg-slate-300';
            const tip = readiness === 'pass' ? 'All evidence passes'
              : readiness === 'warn' ? `${es.warnings} warning(s)`
              : readiness === 'fail' ? `${es.failed} failure(s)` : 'Pending';
            return (
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
                title={tip}
              />
            );
          })()}
        </div>

        {/* Summary Zone — layout driven by card face preset */}
        {!isCompact && intentConfig?.summaryFields && (
          <div className={`mt-1.5 ${preset?.summaryLayout === 'stats-grid' ? 'grid grid-cols-2 gap-1' : ''}`}>
            <CardSummaryZone
              fields={intentConfig.summaryFields}
              card={card}
              compact={!isExpanded}
            />
          </div>
        )}

        {/* Fallback: generic KPI summary (when no intent config) */}
        {!isCompact && !intentConfig && kpiEntries.length > 0 && (() => {
          const displayable = kpiEntries
            .filter(([key]) => key && key !== 'undefined')
            .slice(0, 2)
            .map(([key, val]) => {
              const display = val == null ? '--'
                : typeof val === 'object' ? JSON.stringify(val)
                : String(val);
              return `${key}: ${display}`;
            });
          if (displayable.length === 0) return null;
          return (
            <div className="text-xs text-content-tertiary truncate mt-1">
              {displayable.join(' | ')}
            </div>
          );
        })()}

        {/* Dependency count */}
        {depCount > 0 && (
          <div className="text-xs text-content-muted mt-1">
            {depCount} dep{depCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* ── Execution indicators (C3.1) ── */}

        {/* Progress bar — shown when running and has estimate */}
        {card.status === 'running' && (card.cost_estimate != null || card.time_estimate) && (
          <div className="mt-1.5">
            <div className="h-1 bg-surface-bg border border-surface-border overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* Tool chip */}
        {card.selected_tool && (
          <div className="flex items-center gap-1 mt-1">
            <Wrench size={10} className="text-content-muted shrink-0" />
            <span className="text-[10px] text-content-secondary truncate">
              {card.selected_tool.slug}
            </span>
            {card.selected_tool.version && (
              <span className="text-[9px] text-content-muted">v{card.selected_tool.version}</span>
            )}
          </div>
        )}

        {/* Cost */}
        {(card.actual_cost != null || card.cost_estimate != null) && (
          <div className="flex items-center gap-1 mt-0.5">
            <DollarSign size={10} className="text-content-muted shrink-0" />
            <span className="text-[10px] text-content-muted studio-mono">
              {card.actual_cost != null
                ? `$${card.actual_cost.toFixed(2)}`
                : `~$${card.cost_estimate!.toFixed(2)}`}
            </span>
          </div>
        )}

        {/* Evidence summary */}
        {card.evidence_summary && card.evidence_summary.total > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            {card.evidence_summary.passed > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                <CheckCircle2 size={10} />{card.evidence_summary.passed}
              </span>
            )}
            {card.evidence_summary.failed > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                <XCircle size={10} />{card.evidence_summary.failed}
              </span>
            )}
            {card.evidence_summary.warnings > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-500">
                <AlertTriangle size={10} />{card.evidence_summary.warnings}
              </span>
            )}
            <span className="text-[9px] text-content-muted">
              /{card.evidence_summary.total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

CardComponent.displayName = 'CardComponent';

export default CardComponent;
