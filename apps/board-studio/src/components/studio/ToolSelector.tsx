// ============================================================
// ToolSelector — Ranked tool recommendations with selection
// ============================================================

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  FlaskConical,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { ToolRecommendation, TrustLevel } from '@/types/execution';

export interface ToolSelectorProps {
  tools: ToolRecommendation[];
  isLoading?: boolean;
  error?: Error | null;
  selectedToolSlug?: string;
  onSelect: (tool: ToolRecommendation) => void;
}

// --- Trust level config ---

const trustConfig: Record<
  TrustLevel,
  { label: string; variant: BadgeVariant; Icon: typeof ShieldCheck }
> = {
  certified: { label: 'CERTIFIED', variant: 'success', Icon: ShieldCheck },
  verified: { label: 'VERIFIED', variant: 'info', Icon: BadgeCheck },
  experimental: { label: 'EXPERIMENTAL', variant: 'warning', Icon: FlaskConical },
};

const trustOrder: TrustLevel[] = ['certified', 'verified', 'experimental'];

// --- Score bar ---

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 bg-surface-bg border border-surface-border">
        <div
          className="h-full bg-brand-secondary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-content-muted studio-mono w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

// --- Pipeline steps ---

function PipelineSteps({ steps }: { steps: string[] }) {
  return (
    <div className="flex items-center gap-0.5 flex-wrap mt-1.5">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={10} className="text-content-muted" />}
          <span className="text-[10px] px-1.5 py-0.5 bg-surface-bg border border-surface-border text-content-secondary">
            {step}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Tool card ---

function ToolCard({
  tool,
  isSelected,
  onSelect,
}: {
  tool: ToolRecommendation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const trust = trustConfig[tool.trust_level] ?? trustConfig.experimental;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left p-3 border transition-all
        ${isSelected
          ? 'border-brand-secondary bg-blue-50/40 ring-1 ring-brand-secondary/30'
          : 'border-surface-border bg-white hover:border-slate-300'
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-content-primary truncate">
            {tool.name}
          </span>
          <span className="text-[10px] text-content-muted shrink-0">
            v{tool.version}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && (
            <CheckCircle2 size={14} className="text-brand-secondary" />
          )}
          <Badge variant={trust.variant} className="text-[9px]">
            <trust.Icon size={10} className="mr-0.5" />
            {trust.label}
          </Badge>
        </div>
      </div>

      {/* Score bar */}
      <div className="mt-2">
        <ScoreBar score={tool.match_score} />
      </div>

      {/* Cost / time / reasons */}
      <div className="flex items-center gap-3 mt-2 text-[11px] text-content-muted">
        <span>~${tool.cost_estimate}</span>
        <span>{tool.time_estimate}</span>
      </div>

      {/* Match reasons */}
      {tool.match_reasons.length > 0 && (
        <p className="text-[11px] text-content-tertiary mt-1 line-clamp-2">
          {tool.match_reasons.join(' · ')}
        </p>
      )}

      {/* Pipeline steps */}
      {tool.pipelines?.[0]?.steps && (
        <PipelineSteps steps={tool.pipelines[0].steps} />
      )}
    </button>
  );
}

// --- Main component ---

const ToolSelector: React.FC<ToolSelectorProps> = ({
  tools,
  isLoading,
  error,
  selectedToolSlug,
  onSelect,
}) => {
  // Loading
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Select Tool
        </h3>
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-50 border border-surface-border" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Select Tool
        </h3>
        <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 text-xs text-red-700">
          <AlertCircle size={14} />
          Failed to load tool recommendations.
        </div>
      </div>
    );
  }

  // Group by trust level
  const grouped = trustOrder
    .map((level) => ({
      level,
      tools: tools.filter((t) => t.trust_level === level),
    }))
    .filter((g) => g.tools.length > 0);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
        Select Tool
      </h3>

      {tools.length === 0 ? (
        <div className="text-center py-6 text-sm text-content-tertiary border border-dashed border-surface-border">
          No tools available for this intent type.
        </div>
      ) : (
        grouped.map(({ level, tools: groupTools }) => (
          <div key={level} className="space-y-1.5">
            <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">
              {trustConfig[level].label}
            </span>
            {groupTools
              .sort((a, b) => b.match_score - a.match_score)
              .map((tool) => (
                <ToolCard
                  key={tool.slug}
                  tool={tool}
                  isSelected={selectedToolSlug === tool.slug}
                  onSelect={() => onSelect(tool)}
                />
              ))}
          </div>
        ))
      )}
    </div>
  );
};

ToolSelector.displayName = 'ToolSelector';

export default ToolSelector;
