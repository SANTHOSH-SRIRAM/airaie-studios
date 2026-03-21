// ============================================================
// ToolCard — individual tool/pipeline card with score, trust badge, rationale
// ============================================================

import React, { useState, memo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { ToolShelfEntry, PipelineShelfEntry } from '@api/toolshelf';

// --- Trust level badge mapping ---

const trustBadgeVariant: Record<string, BadgeVariant> = {
  certified: 'success',
  verified: 'info',
  experimental: 'warning',
};

// --- Props ---

export interface ToolCardProps {
  entry: ToolShelfEntry | PipelineShelfEntry;
  variant: 'recommended' | 'alternative' | 'unavailable';
  unavailableReason?: string;
  unavailableAction?: string;
}

// --- Component ---

const ToolCard = memo(function ToolCard({
  entry,
  variant,
  unavailableReason,
  unavailableAction,
}: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isUnavailable = variant === 'unavailable';
  const name = entry.name;
  const version = 'tool_version' in entry ? entry.tool_version : '';
  const trustLevel = entry.trust_level ?? '';
  const costEstimate = 'cost_estimate' in entry ? entry.cost_estimate : 0;
  const successRate = 'success_rate' in entry ? (entry as ToolShelfEntry).success_rate : undefined;
  const score = 'score' in entry ? entry.score : 0;
  const matchReasons = 'match_reasons' in entry ? entry.match_reasons : [];

  return (
    <div
      className={`
        border rounded-lg p-3 transition-colors
        ${isUnavailable ? 'opacity-60 bg-surface-secondary border-surface-border' : ''}
        ${variant === 'recommended' ? 'border-blue-200 bg-blue-50/30' : ''}
        ${variant === 'alternative' ? 'border-surface-border bg-white' : ''}
      `}
    >
      {/* Header row: name, version, trust badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-content-primary truncate">
            {name}
          </span>
          {version && (
            <span className="text-xs text-content-muted flex-shrink-0">
              v{version}
            </span>
          )}
        </div>
        {trustLevel && (
          <Badge
            variant={trustBadgeVariant[trustLevel] ?? 'neutral'}
            badgeStyle="outline"
          >
            {trustLevel}
          </Badge>
        )}
      </div>

      {/* Metrics row: cost, success rate, score bar */}
      {!isUnavailable && (
        <div className="mt-2 flex items-center gap-3 text-xs text-content-muted">
          <span>${costEstimate.toFixed(2)}</span>
          {successRate !== undefined && (
            <span>{Math.round(successRate * 100)}%</span>
          )}
          <div className="flex-1">
            <div
              data-testid="score-bar"
              className="h-1.5 bg-surface-border rounded-full overflow-hidden"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  score >= 0.8
                    ? 'bg-green-500'
                    : score >= 0.5
                      ? 'bg-yellow-500'
                      : 'bg-red-400'
                }`}
                style={{ width: `${score * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 1-line "Why" text + expand button */}
      {matchReasons.length > 0 && !isUnavailable && (
        <div className="mt-2">
          <div className="flex items-start gap-1">
            <p className="text-xs text-content-secondary flex-1">
              {matchReasons[0]}
            </p>
            {matchReasons.length > 1 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex-shrink-0 p-0.5 text-content-muted hover:text-content-primary transition-colors"
                aria-label={expanded ? 'Collapse rationale' : 'Expand rationale'}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          {/* Expanded breakdown */}
          {expanded && (
            <ul className="mt-1.5 space-y-1 text-xs text-content-secondary list-disc pl-4">
              {matchReasons.slice(1).map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Unavailable: reason + action button */}
      {isUnavailable && unavailableReason && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-content-muted">{unavailableReason}</p>
          {unavailableAction && (
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {unavailableAction}
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default ToolCard;
