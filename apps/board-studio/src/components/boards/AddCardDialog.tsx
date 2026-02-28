// ============================================================
// AddCardDialog — Modal form for adding a new card to a board
// ============================================================

import React from 'react';
import { useForm } from 'react-hook-form';
import { Modal, Input, Select, Button } from '@airaie/ui';
import type { SelectOption } from '@airaie/ui';
import { useCreateCard, useCards } from '@hooks/useCards';

export interface AddCardDialogProps {
  boardId: string;
  open: boolean;
  onClose: () => void;
}

interface AddCardFormData {
  name: string;
  type: string;
  description: string;
  dependencies: string[];
}

const cardTypeOptions: SelectOption[] = [
  { value: 'simulation', label: 'Simulation' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'validation', label: 'Validation' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'custom', label: 'Custom' },
];

const AddCardDialog: React.FC<AddCardDialogProps> = ({ boardId, open, onClose }) => {
  const createCard = useCreateCard(boardId);
  const { data: existingCards } = useCards(boardId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddCardFormData>({
    defaultValues: {
      name: '',
      type: 'simulation',
      description: '',
      dependencies: [],
    },
  });

  const onSubmit = (data: AddCardFormData) => {
    createCard.mutate(
      {
        name: data.name,
        type: data.type,
        description: data.description || undefined,
        dependencies: data.dependencies.length > 0 ? data.dependencies : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Card" width="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <Input
          label="Name"
          placeholder="e.g. Thermal Simulation"
          error={errors.name?.message}
          {...register('name', { required: 'Card name is required' })}
        />

        {/* Type */}
        <Select
          label="Type"
          options={cardTypeOptions}
          {...register('type', { required: 'Card type is required' })}
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-content-primary">
            Description
          </label>
          <textarea
            className="w-full h-20 px-3 py-2 text-sm bg-white border border-surface-border rounded-none text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-1 resize-none"
            placeholder="Optional description..."
            {...register('description')}
          />
        </div>

        {/* Dependencies (multi-select via checkboxes) */}
        {existingCards && existingCards.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-content-primary">
              Dependencies
            </label>
            <div className="border border-surface-border max-h-32 overflow-y-auto p-2 space-y-1">
              {existingCards.map((card) => (
                <label
                  key={card.id}
                  className="flex items-center gap-2 text-sm text-content-primary cursor-pointer hover:bg-slate-50 px-1 py-0.5"
                >
                  <input
                    type="checkbox"
                    value={card.id}
                    className="rounded-none border-surface-border"
                    {...register('dependencies')}
                  />
                  <span className="truncate">{card.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {createCard.isError && (
          <p className="text-xs text-status-danger">
            {createCard.error instanceof Error
              ? createCard.error.message
              : 'Failed to create card.'}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={createCard.isPending}
          >
            Create Card
          </Button>
        </div>
      </form>
    </Modal>
  );
};

AddCardDialog.displayName = 'AddCardDialog';

export default AddCardDialog;
