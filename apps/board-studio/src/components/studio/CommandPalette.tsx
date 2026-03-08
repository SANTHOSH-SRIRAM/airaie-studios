// ============================================================
// CommandPalette — Cmd+K command palette using cmdk
// ============================================================

import React, { useMemo } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Layers,
  ShieldCheck,
  Play,
  Eye,
  ArrowUpRight,
  Download,
  LayoutGrid,
  GitBranch,
  Table2,
  GanttChart,
  Package,
  Plus,
} from 'lucide-react';
import type { Card, Gate } from '@/types/board';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  cards: Card[];
  gates: Gate[];
  boardMode?: string;
  onSelectCard: (cardId: string) => void;
  onSelectGate: (gateId: string) => void;
  onChangeView: (view: string) => void;
  onOpenExport: () => void;
  onEscalate: () => void;
  onOpenReleasePacket?: () => void;
  onCreateSubBoard?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  cards,
  gates,
  boardMode,
  onSelectCard,
  onSelectGate,
  onChangeView,
  onOpenExport,
  onEscalate,
  onOpenReleasePacket,
  onCreateSubBoard,
}) => {
  // Compute escalation label based on current board mode
  const modeEscalationMap: Record<string, string> = {
    explore: 'study',
    study: 'release',
  };
  const nextMode = boardMode ? modeEscalationMap[boardMode] : undefined;
  const escalateLabel = nextMode
    ? `Escalate: ${boardMode} \u2192 ${nextMode}`
    : 'Escalate board mode';
  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => a.ordinal - b.ordinal),
    [cards]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/20"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[560px]"
          >
            <Command
              className="studio-frosted-backdrop border border-surface-border shadow-xl overflow-hidden"
              label="Command palette"
            >
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 border-b border-surface-border">
                <Search size={16} className="text-content-tertiary flex-shrink-0" />
                <Command.Input
                  placeholder="Search cards, gates, actions..."
                  className="flex-1 h-11 bg-transparent text-sm text-content-primary placeholder:text-content-muted outline-none border-none"
                  autoFocus
                />
              </div>

              {/* Results */}
              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-content-tertiary">
                  No results found.
                </Command.Empty>

                {/* View modes */}
                <Command.Group heading="Views" className="mb-2">
                  <PaletteItem
                    icon={<LayoutGrid size={14} />}
                    label="Board view"
                    onSelect={() => { onChangeView('board'); onClose(); }}
                  />
                  <PaletteItem
                    icon={<GitBranch size={14} />}
                    label="DAG view"
                    onSelect={() => { onChangeView('dag'); onClose(); }}
                  />
                  <PaletteItem
                    icon={<Table2 size={14} />}
                    label="Table view"
                    onSelect={() => { onChangeView('table'); onClose(); }}
                  />
                  <PaletteItem
                    icon={<GanttChart size={14} />}
                    label="Timeline view"
                    onSelect={() => { onChangeView('timeline'); onClose(); }}
                  />
                </Command.Group>

                {/* Cards */}
                {sortedCards.length > 0 && (
                  <Command.Group heading="Cards" className="mb-2">
                    {sortedCards.map((card) => (
                      <PaletteItem
                        key={card.id}
                        icon={<Layers size={14} />}
                        label={card.name}
                        suffix={
                          <span className="text-[10px] text-content-muted capitalize">
                            {card.status}
                          </span>
                        }
                        onSelect={() => { onSelectCard(card.id); onClose(); }}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Gates */}
                {gates.length > 0 && (
                  <Command.Group heading="Gates" className="mb-2">
                    {gates.map((gate) => (
                      <PaletteItem
                        key={gate.id}
                        icon={<ShieldCheck size={14} />}
                        label={gate.name}
                        suffix={
                          <span className="text-[10px] text-content-muted">
                            {gate.status}
                          </span>
                        }
                        onSelect={() => { onSelectGate(gate.id); onClose(); }}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Actions */}
                <Command.Group heading="Actions">
                  {nextMode && (
                    <PaletteItem
                      icon={<ArrowUpRight size={14} />}
                      label={escalateLabel}
                      onSelect={() => { onEscalate(); onClose(); }}
                    />
                  )}
                  <PaletteItem
                    icon={<Download size={14} />}
                    label="Export board"
                    onSelect={() => { onOpenExport(); onClose(); }}
                  />
                  {onOpenReleasePacket && (
                    <PaletteItem
                      icon={<Package size={14} />}
                      label="View release packet"
                      onSelect={() => { onOpenReleasePacket(); onClose(); }}
                    />
                  )}
                  {onCreateSubBoard && (
                    <PaletteItem
                      icon={<Plus size={14} />}
                      label="Create sub-board"
                      onSelect={() => { onCreateSubBoard(); onClose(); }}
                    />
                  )}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Palette item ---

function PaletteItem({
  icon,
  label,
  suffix,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  suffix?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-content-secondary
        cursor-pointer select-none
        data-[selected=true]:bg-surface-hover data-[selected=true]:text-content-primary
        transition-colors"
    >
      <span className="text-content-tertiary flex-shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {suffix}
    </Command.Item>
  );
}

CommandPalette.displayName = 'CommandPalette';

export default CommandPalette;
