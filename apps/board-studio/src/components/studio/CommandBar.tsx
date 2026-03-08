// ============================================================
// CommandBar — top bar with board name, mode, breadcrumb, actions
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRight,
  ChevronDown,
  Download,
  ArrowUpRight,
  Settings,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Package,
  GitBranch,
} from 'lucide-react';
import { Badge, Button } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { Board, BoardMode } from '@/types/board';
import { escalateBoard } from '@api/boards';
import { boardKeys } from '@hooks/useBoards';
import { ROUTES } from '@/constants/routes';

export interface CommandBarProps {
  board: Board;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onOpenCommandPalette: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onCreateSubBoard?: () => void;
}

const modeVariants: Record<BoardMode, BadgeVariant> = {
  explore: 'info',
  study: 'warning',
  release: 'success',
};

const modeColors: Record<BoardMode, string> = {
  explore: 'var(--mode-explore)',
  study: 'var(--mode-study)',
  release: 'var(--mode-release)',
};

const modeEscalationTarget: Partial<Record<BoardMode, BoardMode>> = {
  explore: 'study',
  study: 'release',
};

const ALL_MODES: BoardMode[] = ['explore', 'study', 'release'];

const CommandBar: React.FC<CommandBarProps> = ({
  board,
  leftPanelVisible,
  rightPanelVisible,
  onToggleLeftPanel,
  onToggleRightPanel,
  onOpenCommandPalette,
  onOpenExport,
  onOpenSettings,
  onCreateSubBoard,
}) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!modeDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [modeDropdownOpen]);

  const escalateMutation = useMutation({
    mutationFn: (targetMode: string) => escalateBoard(board.id, targetMode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(board.id) });
      qc.invalidateQueries({ queryKey: boardKeys.summary(board.id) });
      setModeDropdownOpen(false);
    },
  });

  return (
    <div
      className="flex items-center justify-between px-4 border-b border-surface-border bg-white flex-shrink-0"
      style={{ height: 'var(--studio-command-bar-h)' }}
    >
      {/* Left: panel toggle + breadcrumb + board name + badges */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleLeftPanel}
          className="p-1 text-content-tertiary hover:text-content-primary transition-colors"
          title={leftPanelVisible ? 'Hide outline (Cmd+B)' : 'Show outline (Cmd+B)'}
        >
          {leftPanelVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-content-tertiary">
          <Link
            to={ROUTES.BOARDS}
            className="hover:text-content-primary transition-colors"
          >
            Boards
          </Link>
          <ChevronRight size={12} />
        </nav>

        <h1 className="text-sm font-semibold text-content-primary truncate max-w-[300px]">
          {board.name}
        </h1>

        {/* Mode selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => board.status !== 'archived' && setModeDropdownOpen((p) => !p)}
            className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium border transition-colors ${
              board.status === 'archived'
                ? 'opacity-50 cursor-not-allowed border-surface-border'
                : 'cursor-pointer hover:bg-surface-hover border-surface-border'
            }`}
            style={{ color: modeColors[board.mode] }}
            title="Change board mode"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: modeColors[board.mode] }} />
            {board.mode}
            {board.status !== 'archived' && <ChevronDown size={10} />}
          </button>

          {modeDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-surface-border shadow-lg min-w-[140px]">
              {ALL_MODES.map((mode) => {
                const isCurrent = mode === board.mode;
                return (
                  <button
                    key={mode}
                    onClick={() => {
                      if (!isCurrent) escalateMutation.mutate(mode);
                      else setModeDropdownOpen(false);
                    }}
                    disabled={escalateMutation.isPending}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors ${
                      isCurrent ? 'bg-surface-hover font-medium' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: modeColors[mode] }}
                    />
                    <span className="flex-1 capitalize" style={isCurrent ? { color: modeColors[mode] } : undefined}>
                      {mode}
                    </span>
                    {isCurrent && <Check size={12} className="text-content-muted" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {board.status !== 'active' && (
          <Badge
            variant={board.status === 'completed' ? 'success' : 'neutral'}
            dot
          >
            {board.status}
          </Badge>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-content-tertiary
            bg-surface-bg border border-surface-border hover:border-content-muted
            transition-colors"
          title="Command palette (Cmd+K)"
        >
          <Command size={12} />
          <span className="studio-mono">K</span>
        </button>

        {board.mode === 'release' && (
          <Button
            variant="outline"
            size="sm"
            icon={Package}
            onClick={() => navigate(`/boards/${board.id}/release-packet`)}
          >
            Release Packet
          </Button>
        )}

        {onCreateSubBoard && (
          <Button
            variant="ghost"
            size="sm"
            icon={GitBranch}
            onClick={onCreateSubBoard}
          >
            Sub-Board
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          icon={Download}
          onClick={onOpenExport}
        >
          Export
        </Button>

        <Button variant="ghost" size="sm" icon={Settings} onClick={onOpenSettings}>
          Settings
        </Button>

        <button
          onClick={onToggleRightPanel}
          className="p-1 text-content-tertiary hover:text-content-primary transition-colors"
          title={rightPanelVisible ? 'Hide inspector (Cmd+I)' : 'Show inspector (Cmd+I)'}
        >
          {rightPanelVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>
    </div>
  );
};

CommandBar.displayName = 'CommandBar';

export default CommandBar;
