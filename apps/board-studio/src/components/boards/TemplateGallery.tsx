// ============================================================
// TemplateGallery — visual template browser with quick-create,
// custom board creation, and guided wizard entry points
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Search, Wand2, SlidersHorizontal, Layers, GitBranch,
  Plus, FileText, Box, BarChart3, Bot, Flag, ArrowRightLeft,
} from 'lucide-react';
import { Modal, Input, Badge, Button, Card, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useBoardTemplates } from '@hooks/useBoards';
import type { BoardTemplate, TemplateCard } from '@/types/board';
import BoardCreationWizard from './BoardCreationWizard';

export interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

// --- Card type config ---

const CARD_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; variant: BadgeVariant }> = {
  analysis:   { label: 'Analysis',   icon: BarChart3,       color: 'bg-blue-500',    variant: 'info' },
  sweep:      { label: 'Sweep',      icon: SlidersHorizontal, color: 'bg-purple-500',  variant: 'neutral' },
  comparison: { label: 'Comparison', icon: ArrowRightLeft,  color: 'bg-teal-500',    variant: 'success' },
  agent:      { label: 'Agent',      icon: Bot,             color: 'bg-amber-500',   variant: 'warning' },
  milestone:  { label: 'Milestone',  icon: Flag,            color: 'bg-green-600',   variant: 'success' },
  gate:       { label: 'Gate',       icon: GitBranch,       color: 'bg-red-500',     variant: 'danger' },
};

function getCardTypeConfig(type: string) {
  return CARD_TYPE_CONFIG[type] ?? { label: type, icon: FileText, color: 'bg-gray-400', variant: 'neutral' as BadgeVariant };
}

// --- Template card preview with labeled card types ---

function TemplateCardPreview({ cards }: { cards: TemplateCard[] }) {
  // Group cards by type and show counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.forEach((c) => {
      const t = c.card_type || 'analysis';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [cards]);

  if (typeCounts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {typeCounts.map(([type, count]) => {
        const config = getCardTypeConfig(type);
        const Icon = config.icon;
        return (
          <span
            key={type}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-hover text-content-secondary"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
            <Icon size={10} />
            {count} {config.label}
          </span>
        );
      })}
    </div>
  );
}

// --- Mode badge ---

function ModeBadge({ mode }: { mode: string }) {
  const config: Record<string, { variant: BadgeVariant; label: string }> = {
    explore: { variant: 'success', label: 'Explore' },
    study: { variant: 'warning', label: 'Study' },
    release: { variant: 'danger', label: 'Release' },
  };
  const c = config[mode] ?? { variant: 'neutral' as BadgeVariant, label: mode };
  return <Badge variant={c.variant} dot className="text-[10px]">{c.label}</Badge>;
}

// --- Main component ---

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ open, onClose }) => {
  const { data: templates, isLoading } = useBoardTemplates();
  const [search, setSearch] = useState('');
  const [quickCreateTemplate, setQuickCreateTemplate] = useState<BoardTemplate | null>(null);
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);
  const [showCustomCreate, setShowCustomCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);

  const filtered = useMemo(() => {
    if (!templates) return [];
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [templates, search]);

  // Quick-create flow
  if (quickCreateTemplate) {
    return (
      <BoardCreationWizard
        open={open}
        onClose={() => { setQuickCreateTemplate(null); onClose(); }}
        mode="quick"
        template={quickCreateTemplate}
      />
    );
  }

  // Guided wizard flow
  if (showGuidedWizard) {
    return (
      <BoardCreationWizard
        open={open}
        onClose={() => { setShowGuidedWizard(false); setSelectedTemplate(null); onClose(); }}
        mode="guided"
        template={selectedTemplate ?? undefined}
      />
    );
  }

  // Custom create flow (no template)
  if (showCustomCreate) {
    return (
      <BoardCreationWizard
        open={open}
        onClose={() => { setShowCustomCreate(false); onClose(); }}
        mode="guided"
        template={undefined}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a Board" width="max-w-5xl">
      <div className="space-y-5">
        {/* Top bar: Search + actions */}
        <div className="flex items-center justify-between gap-3">
          <Input
            icon={Search}
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="flex-1 max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => setShowCustomCreate(true)}
            >
              Custom Board
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => setShowGuidedWizard(true)}
            >
              Guided Setup
            </Button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Layers}
            heading="No templates found"
            description={search ? 'Try a different search term.' : 'No board templates available.'}
            action={
              <Button variant="primary" icon={Plus} onClick={() => setShowCustomCreate(true)}>
                Create Custom Board
              </Button>
            }
          />
        )}

        {/* Custom create card + Templates grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom Create Card — always first */}
            <Card
              hover
              className="flex flex-col border-dashed border-2 border-surface-border cursor-pointer"
              onClick={() => setShowCustomCreate(true)}
            >
              <Card.Body className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center">
                  <Plus size={24} className="text-content-tertiary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-content-primary">Custom Board</h3>
                  <p className="text-xs text-content-tertiary mt-1">
                    Start from scratch — choose your own cards, gates, and configuration
                  </p>
                </div>
              </Card.Body>
            </Card>

            {/* Template Cards */}
            {filtered.map((template) => {
              const cardCount = template.cards_template?.length ?? 0;
              const gateCount = template.gates_template?.length ?? 0;

              return (
                <Card key={template.id} hover className="flex flex-col">
                  <Card.Body className="flex-1 space-y-3">
                    {/* Header: name + mode badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-content-primary leading-tight">
                        {template.name}
                      </h3>
                      <ModeBadge mode={template.mode} />
                    </div>

                    {/* Full description */}
                    <p className="text-xs text-content-secondary leading-relaxed">
                      {template.description}
                    </p>

                    {/* Card type breakdown with icons and labels */}
                    {template.cards_template && template.cards_template.length > 0 && (
                      <TemplateCardPreview cards={template.cards_template} />
                    )}

                    {/* Stats: card count + gate count */}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
                        <Layers size={12} />
                        {cardCount} card{cardCount !== 1 ? 's' : ''}
                      </span>
                      {gateCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-content-tertiary">
                          <GitBranch size={12} />
                          {gateCount} gate{gateCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </Card.Body>

                  <Card.Footer className="flex items-center gap-2 border-t border-surface-border">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Wand2}
                      className="flex-1"
                      onClick={(e) => { e.stopPropagation(); setQuickCreateTemplate(template); }}
                    >
                      Quick Create
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); setShowGuidedWizard(true); }}
                    >
                      Customize
                    </Button>
                  </Card.Footer>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TemplateGallery;
