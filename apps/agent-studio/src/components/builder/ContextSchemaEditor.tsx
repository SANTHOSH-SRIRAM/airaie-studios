import React from 'react';
import { cn, Button } from '@airaie/ui';
import { Plus } from 'lucide-react';
import type { SchemaField } from '@airaie/shared';
import { useSpecStore } from '@store/specStore';
import ContextInputRow from './ContextInputRow';

const emptyField: SchemaField = { name: '', type: 'string', description: '' };

const ContextSchemaEditor: React.FC<{ className?: string }> = ({ className }) => {
  const contextSchema = useSpecStore((s) => s.contextSchema);
  const setContextSchema = useSpecStore((s) => s.setContextSchema);

  const updateRequired = (index: number, updated: SchemaField) => {
    const next = [...contextSchema.required_inputs];
    next[index] = updated;
    setContextSchema({ ...contextSchema, required_inputs: next });
  };

  const removeRequired = (index: number) => {
    setContextSchema({
      ...contextSchema,
      required_inputs: contextSchema.required_inputs.filter((_, i) => i !== index),
    });
  };

  const addRequired = () => {
    setContextSchema({
      ...contextSchema,
      required_inputs: [...contextSchema.required_inputs, { ...emptyField }],
    });
  };

  const updateOptional = (index: number, updated: SchemaField) => {
    const next = [...contextSchema.optional_inputs];
    next[index] = updated;
    setContextSchema({ ...contextSchema, optional_inputs: next });
  };

  const removeOptional = (index: number) => {
    setContextSchema({
      ...contextSchema,
      optional_inputs: contextSchema.optional_inputs.filter((_, i) => i !== index),
    });
  };

  const addOptional = () => {
    setContextSchema({
      ...contextSchema,
      optional_inputs: [...contextSchema.optional_inputs, { ...emptyField }],
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Required Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-content-primary">Required Inputs</label>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addRequired}>
            Add
          </Button>
        </div>
        {contextSchema.required_inputs.length === 0 ? (
          <p className="text-sm text-content-muted py-2">No required inputs defined.</p>
        ) : (
          <div className="space-y-2">
            {contextSchema.required_inputs.map((field, i) => (
              <ContextInputRow
                key={i}
                field={field}
                onChange={(updated) => updateRequired(i, updated)}
                onRemove={() => removeRequired(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Optional Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-content-primary">Optional Inputs</label>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addOptional}>
            Add
          </Button>
        </div>
        {contextSchema.optional_inputs.length === 0 ? (
          <p className="text-sm text-content-muted py-2">No optional inputs defined.</p>
        ) : (
          <div className="space-y-2">
            {contextSchema.optional_inputs.map((field, i) => (
              <ContextInputRow
                key={i}
                field={field}
                onChange={(updated) => updateOptional(i, updated)}
                onRemove={() => removeOptional(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

ContextSchemaEditor.displayName = 'ContextSchemaEditor';

export default ContextSchemaEditor;
