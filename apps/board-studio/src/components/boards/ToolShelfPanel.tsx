// ============================================================
// ToolShelfPanel — Ranked tool list with trust badges, explainability
// ============================================================

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, AlertCircle, Wrench, Workflow } from 'lucide-react';
import { Card, Badge, Button, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useToolShelf } from '@hooks/useToolShelf';
import { useGeneratePlan } from '@hooks/usePlan';
import type { ToolEntry, TrustLevel } from '@/types/board';

export interface ToolShelfPanelProps {
  cardId: string | undefined;
}

// --- Trust level -> badge variant mapping ---

const trustVariants: Record<TrustLevel, BadgeVariant> = {
  CERTIFIED: 'success',
  VERIFIED: 'info',
  EXPERIMENTAL: 'warning',
};

// --- Individual tool entry row ---

interface ToolEntryRowProps {
  tool: ToolEntry;
  rank: number;
}

function ToolEntryRow({ tool, rank }: ToolEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isUnavailable = !tool.available;

  return (
    <Card
      className={isUnavailable ? 'opacity-50' : ''}
      hover={!isUnavailable}
    >
      <Card.Body className="py-3">
        {/* Main row */}
        <div className="flex items-start gap-3">
          {/* Rank number */}
          <span className="text-xs font-bold text-content-muted w-5 text-right mt-0.5">
            #{rank}
          </span>

          {/* Tool info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tool name */}
              <span className="font-medium text-sm text-content-primary">
                {tool.name}
              </span>

              {/* Trust level badge */}
              <Badge variant={trustVariants[tool.trust_level]} className="text-[10px]">
                {tool.trust_level}
              </Badge>

              {/* Type indicator */}
              <span className="inline-flex items-center gap-1 text-[10px] text-content-muted">
                {tool.type === 'pipeline' ? (
                  <Workflow size={10} />
                ) : (
                  <Wrench size={10} />
                )}
                {tool.type}
              </span>
            </div>

            {/* Score */}
            <div className="text-xs text-content-tertiary mt-1">
              Score: {tool.score}
            </div>

            {/* Unavailable reason */}
            {isUnavailable && tool.unavailable_reason && (
              <div className="flex items-center gap-1 text-xs text-status-danger mt-1">
                <AlertCircle size={12} />
                {tool.unavailable_reason}
              </div>
            )}
          </div>

          {/* Expand/collapse toggle */}
          {tool.rank_explanation.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-content-muted hover:text-content-primary transition-colors shrink-0"
            >
              Why this tool?
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>

        {/* Expanded explanation */}
        {expanded && tool.rank_explanation.length > 0 && (
          <div className="mt-3 ml-8 pl-3 border-l-2 border-surface-border">
            <ul className="space-y-1">
              {tool.rank_explanation.map((reason, i) => (
                <li key={i} className="text-xs text-content-secondary">
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

// --- Main component ---

const ToolShelfPanel: React.FC<ToolShelfPanelProps> = ({ cardId }) => {
  const { data: tools, isLoading, error } = useToolShelf(cardId);
  const generatePlan = useGeneratePlan(cardId);

  // Loading state: skeleton list
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-content-primary">
          Available Tools
        </h3>
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 border border-surface-border" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-content-primary">
          Available Tools
        </h3>
        <Card>
          <Card.Body>
            <div className="flex items-center gap-2 text-sm text-status-danger">
              <AlertCircle size={16} />
              Failed to resolve tools.
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Sort tools by score (highest first)
  const sortedTools = [...(tools ?? [])].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-content-primary">
        Available Tools
      </h3>

      {/* Empty state */}
      {sortedTools.length === 0 ? (
        <Card>
          <Card.Body>
            <p className="text-sm text-content-tertiary text-center py-4">
              No tools match this intent.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedTools.map((tool, i) => (
            <ToolEntryRow key={tool.id} tool={tool} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Generate Plan button */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="sm"
          icon={Zap}
          onClick={() => generatePlan.mutate()}
          loading={generatePlan.isPending}
          disabled={!cardId || sortedTools.length === 0}
        >
          Generate Plan
        </Button>
      </div>
    </div>
  );
};

ToolShelfPanel.displayName = 'ToolShelfPanel';

export default ToolShelfPanel;
