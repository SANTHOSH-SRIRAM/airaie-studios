// ============================================================
// TemplateGallery — visual template browser with quick-create
// and guided wizard entry points
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, Wand2, SlidersHorizontal, Layers, GitBranch } from 'lucide-react';
import { Modal, Input, Badge, Button, Card, Spinner, EmptyState } from '@airaie/ui';
import { useBoardTemplates } from '@hooks/useBoards';
import type { BoardTemplate } from '@/types/board';
import BoardCreationWizard from './BoardCreationWizard';

export interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

// Mini preview: colored dots for cards, small lines for deps
function TemplatePreview({ template }: { template: BoardTemplate }) {
  const cardCount = template.cards_template?.length ?? 0;
  const gateCount = template.gates_template?.length ?? 0;

  return (
    <div className="flex items-center gap-1 py-2">
      {Array.from({ length: Math.min(cardCount, 8) }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-brand-secondary opacity-70"
          title={template.cards_template?.[i]?.title}
        />
      ))}
      {cardCount > 8 && (
        <span className="text-xs text-content-muted">+{cardCount - 8}</span>
      )}
      {gateCount > 0 && (
        <>
          <span className="mx-1 text-content-muted">|</span>
          {Array.from({ length: Math.min(gateCount, 6) }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-sm bg-amber-400 opacity-70"
              title={template.gates_template?.[i]?.name}
            />
          ))}
        </>
      )}
    </div>
  );
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ open, onClose }) => {
  const { data: templates, isLoading } = useBoardTemplates();
  const [search, setSearch] = useState('');
  const [quickCreateTemplate, setQuickCreateTemplate] = useState<BoardTemplate | null>(null);
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);
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
        onClose={() => {
          setQuickCreateTemplate(null);
          onClose();
        }}
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
        onClose={() => {
          setShowGuidedWizard(false);
          setSelectedTemplate(null);
          onClose();
        }}
        mode="guided"
        template={selectedTemplate ?? undefined}
      />
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Create a Board" width="max-w-4xl">
      <div className="space-y-5">
        {/* Search + Guided Setup CTA */}
        <div className="flex items-end justify-between gap-3">
          <Input
            icon={Search}
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            wrapperClassName="flex-1 max-w-sm"
          />
          <Button
            variant="outline"
            icon={SlidersHorizontal}
            onClick={() => setShowGuidedWizard(true)}
          >
            Guided Setup
          </Button>
        </div>

        {/* Templates grid */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            icon={Layers}
            heading="No templates found"
            description={search ? 'Try a different search term.' : 'No board templates available.'}
            action={
              <Button variant="outline" onClick={() => setShowGuidedWizard(true)}>
                Start from scratch
              </Button>
            }
          />
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <Card key={template.id} hover className="flex flex-col">
                <Card.Body className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-content-primary">{template.name}</h3>
                  <p className="text-xs text-content-secondary line-clamp-2">
                    {template.description}
                  </p>

                  {/* Mini preview */}
                  <TemplatePreview template={template} />

                  {/* Metadata badges */}
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      <Layers size={10} className="mr-0.5" />
                      {template.cards_template?.length ?? 0} cards
                    </Badge>
                    <Badge variant="warning">
                      <GitBranch size={10} className="mr-0.5" />
                      {template.gates_template?.length ?? 0} gates
                    </Badge>
                  </div>
                </Card.Body>

                <Card.Footer className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Wand2}
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickCreateTemplate(template);
                    }}
                  >
                    Quick Create
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                      setShowGuidedWizard(true);
                    }}
                  >
                    Customize
                  </Button>
                </Card.Footer>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TemplateGallery;
