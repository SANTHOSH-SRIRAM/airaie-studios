// ============================================================
// BoardCreationWizard — quick-create + guided 5-step wizard
// ============================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Layers } from 'lucide-react';
import { Modal, Input, Button, Select, ProgressBar, Card, Spinner, Badge, EmptyState } from '@airaie/ui';
import {
  useCreateBoardFromIntent,
  useCreateBoardFromTemplate,
  useVerticals,
  useIntentTypes,
  useBoardTemplates,
} from '@hooks/useBoards';
import type { BoardMode, BoardTemplate, IntentType } from '@/types/board';
import ModeSelector from './ModeSelector';
import IntentSpecForm from './IntentSpecForm';

export interface BoardCreationWizardProps {
  open: boolean;
  onClose: () => void;
  mode: 'quick' | 'guided';
  template?: BoardTemplate;
  parentBoardId?: string;
}

// ============================================================
// Quick Create
// ============================================================

function QuickCreate({
  template,
  onClose,
  parentBoardId,
}: {
  template: BoardTemplate;
  onClose: () => void;
  parentBoardId?: string;
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState('');
  const mutation = useCreateBoardFromTemplate();

  const handleCreate = () => {
    mutation.mutate(
      {
        template_slug: template.slug,
        name: name.trim() || undefined,
        owner: 'studio-user',
        parent_board_id: parentBoardId,
        parameters: {},
      },
      {
        onSuccess: (board) => {
          onClose();
          navigate(`/boards/${board.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
        <Layers size={18} className="text-brand-secondary" />
        <span className="text-sm font-medium text-content-primary">
          {parentBoardId ? 'Quick Create Sub-Board' : `Quick Create from "${template.name}"`}
        </span>
      </div>

      <Input
        label="Board Name"
        placeholder="Enter board name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <Input
        label="Description (optional)"
        placeholder="Brief description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {mutation.isError && (
        <p className="text-xs text-status-danger">
          Failed to create board. Please try again.
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          loading={mutation.isPending}
          disabled={!name.trim()}
        >
          Create Board
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Guided 5-Step Wizard
// ============================================================

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<WizardStep, string> = {
  1: 'Name & Description',
  2: 'Intent Type',
  3: 'Mode',
  4: 'Template',
  5: 'Review & Parameters',
};

function GuidedWizard({
  onClose,
  initialTemplate,
  parentBoardId,
}: {
  onClose: () => void;
  initialTemplate?: BoardTemplate;
  parentBoardId?: string;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2
  const { data: verticals, isLoading: verticalsLoading } = useVerticals();
  const [verticalSlug, setVerticalSlug] = useState('');
  const [selectedIntentType, setSelectedIntentType] = useState<IntentType | null>(null);
  const { data: intentTypes, isLoading: intentTypesLoading } = useIntentTypes(verticalSlug);

  // Step 3
  const [boardMode, setBoardMode] = useState<BoardMode | undefined>(undefined);

  // Step 4
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | undefined>(initialTemplate);
  const { data: templates, isLoading: templatesLoading } = useBoardTemplates();

  // Step 5
  const [intentSpec, setIntentSpec] = useState<Record<string, unknown>>({});

  // Mutations
  const fromIntentMutation = useCreateBoardFromIntent();
  const fromTemplateMutation = useCreateBoardFromTemplate();

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1:
        return !!name.trim();
      case 2:
        return true; // intent type is optional — user can use a template instead
      case 3:
        return !!boardMode;
      case 4:
        return true; // template is optional
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, name, boardMode]);

  const goNext = () => {
    if (step < 5) setStep((step + 1) as WizardStep);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as WizardStep);
  };

  const handleCreate = () => {
    // If template selected and no intent type, use template creation
    if (selectedTemplate && !selectedIntentType) {
      fromTemplateMutation.mutate(
        {
          template_slug: selectedTemplate.slug,
          name: name.trim(),
          owner: 'studio-user',
          parent_board_id: parentBoardId,
          parameters: intentSpec,
        },
        {
          onSuccess: (board) => {
            onClose();
            navigate(`/boards/${board.id}`);
          },
        }
      );
    } else if (selectedIntentType && boardMode) {
      // Map board mode to governance level
      const governanceLevel =
        boardMode === 'release' ? 'full' : boardMode === 'study' ? 'light' : 'none';

      fromIntentMutation.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          parent_board_id: parentBoardId,
          intent_spec: {
            intent_type: selectedIntentType.slug,
            goal: name.trim(),
            inputs: [],
            acceptance_criteria: [],
            governance: { level: governanceLevel },
            ...intentSpec,
          },
        },
        {
          onSuccess: (board) => {
            onClose();
            navigate(`/boards/${board.id}`);
          },
        }
      );
    }
  };

  const isCreating = fromIntentMutation.isPending || fromTemplateMutation.isPending;
  const createError = fromIntentMutation.isError || fromTemplateMutation.isError;

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-content-secondary">
          <span>Step {step} of 5: {STEP_LABELS[step]}</span>
          <span>{Math.round((step / 5) * 100)}%</span>
        </div>
        <ProgressBar value={(step / 5) * 100} />
      </div>

      {/* Step content */}
      <div className="min-h-[240px]">
        {/* Step 1: Name & Description */}
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Board Name"
              placeholder="e.g., Wing Fatigue Analysis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Input
              label="Description (optional)"
              placeholder="Brief description of the board's purpose"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Intent Type */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-content-muted">
              Select an intent type to define the board's purpose, or skip to use a template in step 4.
            </p>
            <Select
              label="Vertical"
              placeholder={verticalsLoading ? 'Loading verticals…' : 'Select a vertical'}
              options={(verticals ?? []).map((v) => ({ value: v.slug, label: v.name }))}
              value={verticalSlug}
              onChange={(e) => {
                setVerticalSlug(e.target.value);
                setSelectedIntentType(null);
              }}
            />

            {intentTypesLoading && (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            )}

            {!intentTypesLoading && intentTypes && intentTypes.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {intentTypes.map((it) => (
                  <button
                    key={it.slug}
                    type="button"
                    onClick={() => setSelectedIntentType(it)}
                    className={`w-full text-left p-3 border transition-colors ${
                      selectedIntentType?.slug === it.slug
                        ? 'border-brand-secondary bg-blue-50'
                        : 'border-surface-border hover:bg-surface-hover'
                    }`}
                  >
                    <div className="text-sm font-medium text-content-primary">{it.name}</div>
                    <div className="text-xs text-content-secondary mt-0.5">{it.description}</div>
                  </button>
                ))}
              </div>
            )}

            {!verticalSlug && (
              <p className="text-sm text-content-muted py-4">Select a vertical to see available intent types.</p>
            )}

            {verticalSlug && !intentTypesLoading && (!intentTypes || intentTypes.length === 0) && (
              <p className="text-sm text-content-muted py-4">No intent types found for this vertical.</p>
            )}
          </div>
        )}

        {/* Step 3: Mode */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-content-secondary">Choose the governance level for your board.</p>
            <ModeSelector value={boardMode} onChange={setBoardMode} />
          </div>
        )}

        {/* Step 4: Template (optional) */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-content-secondary">
              Optionally select a template to pre-populate cards and gates, or start blank.
            </p>

            <button
              type="button"
              onClick={() => setSelectedTemplate(undefined)}
              className={`w-full text-left p-3 border transition-colors ${
                !selectedTemplate
                  ? 'border-brand-secondary bg-blue-50'
                  : 'border-surface-border hover:bg-surface-hover'
              }`}
            >
              <div className="text-sm font-medium text-content-primary">Start Blank</div>
              <div className="text-xs text-content-secondary">No pre-populated cards or gates.</div>
            </button>

            {templatesLoading && (
              <div className="flex items-center justify-center py-4">
                <Spinner />
              </div>
            )}

            {!templatesLoading && templates && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-3 border transition-colors ${
                      selectedTemplate?.id === t.id
                        ? 'border-brand-secondary bg-blue-50'
                        : 'border-surface-border hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-content-primary">{t.name}</div>
                      <div className="flex gap-1.5">
                        <Badge variant="info">{t.cards_template?.length ?? 0} cards</Badge>
                        <Badge variant="warning">{t.gates_template?.length ?? 0} gates</Badge>
                      </div>
                    </div>
                    <div className="text-xs text-content-secondary mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review + Parameters */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-content-primary">Review</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-content-muted">Name:</span>
                <span className="ml-2 text-content-primary font-medium">{name}</span>
              </div>
              {description && (
                <div>
                  <span className="text-content-muted">Description:</span>
                  <span className="ml-2 text-content-primary">{description}</span>
                </div>
              )}
              <div>
                <span className="text-content-muted">Intent Type:</span>
                <span className="ml-2 text-content-primary font-medium">
                  {selectedIntentType?.name ?? 'None'}
                </span>
              </div>
              <div>
                <span className="text-content-muted">Mode:</span>
                <Badge
                  variant={boardMode === 'release' ? 'danger' : boardMode === 'study' ? 'warning' : 'neutral'}
                  badgeStyle="outline"
                  className="ml-2"
                >
                  {boardMode ?? 'None'}
                </Badge>
              </div>
              <div>
                <span className="text-content-muted">Template:</span>
                <span className="ml-2 text-content-primary">
                  {selectedTemplate?.name ?? 'Blank'}
                </span>
              </div>
            </div>

            {/* Intent spec form if intent type is selected */}
            {selectedIntentType && selectedIntentType.parameters?.length > 0 && (
              <div className="pt-3 border-t border-surface-border">
                <h3 className="text-sm font-semibold text-content-primary mb-3">
                  Parameters for {selectedIntentType.name}
                </h3>
                <IntentSpecForm
                  intentType={selectedIntentType}
                  onSubmit={() => {}}
                  inline
                  onChange={setIntentSpec}
                />
              </div>
            )}

            {createError && (
              <p className="text-xs text-status-danger">
                Failed to create board. Please try again.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-border">
        <div>
          {step > 1 && (
            <Button variant="ghost" icon={ArrowLeft} onClick={goBack} disabled={isCreating}>
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>

          {step < 5 ? (
            <Button iconRight={ArrowRight} onClick={goNext} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button
              icon={Check}
              onClick={handleCreate}
              loading={isCreating}
              disabled={!canProceed()}
            >
              Create Board
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main wrapper
// ============================================================

const BoardCreationWizard: React.FC<BoardCreationWizardProps> = ({
  open,
  onClose,
  mode,
  template,
  parentBoardId,
}) => {
  const title = parentBoardId
    ? mode === 'quick' ? 'Quick Create Sub-Board' : 'Create Sub-Board'
    : mode === 'quick' ? 'Quick Create' : 'Create Board';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={mode === 'quick' ? 'max-w-lg' : 'max-w-2xl'}
    >
      {mode === 'quick' && template ? (
        <QuickCreate template={template} onClose={onClose} parentBoardId={parentBoardId} />
      ) : (
        <GuidedWizard onClose={onClose} initialTemplate={template} parentBoardId={parentBoardId} />
      )}
    </Modal>
  );
};

BoardCreationWizard.displayName = 'BoardCreationWizard';

export default BoardCreationWizard;
