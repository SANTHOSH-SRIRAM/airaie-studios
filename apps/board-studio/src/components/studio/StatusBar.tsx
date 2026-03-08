// ============================================================
// StatusBar — bottom bar with board stats, mode, Cmd+K hint
// ============================================================

import React from 'react';
import { Command } from 'lucide-react';
import type { Board, BoardSummary, BoardMode } from '@/types/board';

export interface StatusBarProps {
  board: Board;
  summary: BoardSummary | undefined;
  viewMode: string;
}

const modeColors: Record<BoardMode, string> = {
  explore: 'var(--mode-explore)',
  study: 'var(--mode-study)',
  release: 'var(--mode-release)',
};

const StatusBar: React.FC<StatusBarProps> = ({ board, summary, viewMode }) => {
  const cardDone = summary?.card_progress?.completed ?? 0;
  const cardTotal = summary?.card_progress?.total ?? 0;
  const gateCount = summary?.gate_count ?? 0;
  const gatesPassed = (summary?.gate_summary ?? []).filter((g) => g.status === 'PASSED').length;
  const readiness = summary?.overall_readiness ?? 0;

  // Compute evidence pass rate from readiness.validation dimension
  const evidencePct = summary?.readiness?.validation ?? 0;

  return (
    <div
      className="flex items-center justify-between px-4 border-t border-surface-border bg-surface-bg flex-shrink-0 select-none"
      style={{ height: 'var(--studio-status-bar-h)' }}
    >
      {/* Left: stats */}
      <div className="flex items-center gap-4 text-[11px] text-content-tertiary studio-mono">
        <span>Cards: {cardDone}/{cardTotal} done</span>
        <span className="text-surface-border">·</span>
        <span>Gates: {gatesPassed}/{gateCount} passed</span>
        <span className="text-surface-border">·</span>
        <span>Evidence: {Math.round(evidencePct)}% pass</span>
        <span className="text-surface-border">·</span>
        <span className="font-medium">Readiness: {Math.round(readiness)}%</span>
      </div>

      {/* Center: mode + view */}
      <div className="flex items-center gap-3 text-[11px] text-content-tertiary">
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 inline-block"
            style={{
              backgroundColor: modeColors[board.mode],
              borderRadius: '50%',
            }}
          />
          {board.mode} mode
        </span>
        <span className="text-surface-border">·</span>
        <span>{viewMode} view</span>
      </div>

      {/* Right: keyboard hint */}
      <div className="flex items-center gap-1 text-[11px] text-content-muted">
        <Command size={10} />
        <span className="studio-mono">K</span>
        <span className="ml-1">command palette</span>
      </div>
    </div>
  );
};

StatusBar.displayName = 'StatusBar';

export default StatusBar;
