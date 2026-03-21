// ============================================================
// ToolShelfPanel — Tool Shelf tab content with grouped sections
// ============================================================

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Spinner, Button } from '@airaie/ui';
import { useToolShelfResolve } from '@hooks/useToolShelfResolve';
import ToolCard from '@components/studio/ToolCard';
import type { ToolShelfEntry, PipelineShelfEntry } from '@api/toolshelf';

// --- Props ---

interface ToolShelfPanelProps {
  intentType: string | undefined;
  projectId: string | undefined;
}

// --- Helpers ---

/** Split recommended tools into "recommended" (top tier) and "alternatives" (lower tier). */
function splitRecommendations(tools: ToolShelfEntry[]) {
  if (tools.length === 0) return { recommended: [], alternatives: [] };

  const sorted = [...tools].sort((a, b) => b.score - a.score);
  const topScore = sorted[0].score;
  const threshold = topScore * 0.8;

  const recommended: ToolShelfEntry[] = [];
  const alternatives: ToolShelfEntry[] = [];

  for (const tool of sorted) {
    if (tool.score >= threshold) {
      recommended.push(tool);
    } else {
      alternatives.push(tool);
    }
  }

  return { recommended, alternatives };
}

// --- Section header ---

function SectionHeader({ title, count }: { title: string; count: number }) {
  if (count === 0) return null;
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-content-muted mb-2">
      {title} ({count})
    </h3>
  );
}

// --- Component ---

export default function ToolShelfPanel({ intentType, projectId }: ToolShelfPanelProps) {
  const { data, isLoading, isError, error, refetch } = useToolShelfResolve(intentType, projectId);

  // Guard: no intent type or project
  if (!intentType || !projectId) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-content-tertiary border border-dashed border-surface-border rounded">
        No intent type or project context available.
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner />
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-sm text-content-tertiary border border-dashed border-surface-border rounded">
        <p>Failed to load tool recommendations.</p>
        <p className="text-xs text-content-muted">
          {(error as any)?.message ?? 'Unknown error'}
        </p>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty
  if (
    !data ||
    (data.recommended_tools.length === 0 &&
      data.recommended_pipelines.length === 0 &&
      data.unavailable_tools.length === 0)
  ) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-content-tertiary border border-dashed border-surface-border rounded">
        No tools available for this intent type.
      </div>
    );
  }

  const { recommended, alternatives } = splitRecommendations(data.recommended_tools);

  // Include pipelines in alternatives section
  const pipelineEntries: PipelineShelfEntry[] = data.recommended_pipelines ?? [];

  return (
    <div className="space-y-4">
      {/* Recommended section */}
      {recommended.length > 0 && (
        <div className="bg-blue-50/40 rounded-lg p-3">
          <SectionHeader title="Recommended" count={recommended.length} />
          <div className="space-y-2">
            {recommended.map((tool) => (
              <ToolCard key={tool.tool_id} entry={tool} variant="recommended" />
            ))}
          </div>
        </div>
      )}

      {/* Alternatives section */}
      {(alternatives.length > 0 || pipelineEntries.length > 0) && (
        <div>
          <SectionHeader
            title="Alternatives"
            count={alternatives.length + pipelineEntries.length}
          />
          <div className="space-y-2">
            {alternatives.map((tool) => (
              <ToolCard key={tool.tool_id} entry={tool} variant="alternative" />
            ))}
            {pipelineEntries.map((pipeline) => (
              <ToolCard key={pipeline.pipeline_id} entry={pipeline} variant="alternative" />
            ))}
          </div>
        </div>
      )}

      {/* Unavailable section */}
      {data.unavailable_tools.length > 0 && (
        <div className="opacity-70">
          <SectionHeader title="Unavailable" count={data.unavailable_tools.length} />
          <div className="space-y-2">
            {data.unavailable_tools.map((entry) => (
              <ToolCard
                key={entry.tool_id}
                entry={{
                  tool_id: entry.tool_id,
                  tool_version: '',
                  name: entry.name,
                  trust_level: 'experimental',
                  cost_estimate: 0,
                  time_estimate: '',
                  match_reasons: [],
                  success_rate: 0,
                  confidence: 0,
                  score: 0,
                }}
                variant="unavailable"
                unavailableReason={entry.reason}
                unavailableAction={entry.action}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
