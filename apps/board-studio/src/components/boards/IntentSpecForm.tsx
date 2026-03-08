// ============================================================
// IntentSpecForm — dynamic form from intent type parameter schema
// ============================================================

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Input, Select, Button } from '@airaie/ui';
import type { IntentType, IntentParameter } from '@/types/board';

export interface IntentSpecFormProps {
  intentType: IntentType;
  onSubmit: (values: Record<string, unknown>) => void;
  /** If true, renders inline without a submit button (for embedding in wizard) */
  inline?: boolean;
  /** External ref for the form values — parent reads via onChange */
  onChange?: (values: Record<string, unknown>) => void;
}

function buildDefaultValues(parameters: IntentParameter[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const param of parameters) {
    if (param.default_value !== undefined) {
      defaults[param.key] = param.default_value;
    } else if (param.type === 'boolean') {
      defaults[param.key] = false;
    } else if (param.type === 'number') {
      defaults[param.key] = '';
    } else {
      defaults[param.key] = '';
    }
  }
  return defaults;
}

const IntentSpecForm: React.FC<IntentSpecFormProps> = ({
  intentType,
  onSubmit,
  inline = false,
  onChange,
}) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: buildDefaultValues(intentType.parameters),
  });

  // Watch all fields and report changes to parent
  React.useEffect(() => {
    if (!onChange) return;
    const subscription = watch((values) => {
      onChange(values as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  const internalSubmit = (values: Record<string, unknown>) => {
    // Coerce numbers
    const coerced: Record<string, unknown> = {};
    for (const param of intentType.parameters) {
      const val = values[param.key];
      if (param.type === 'number' && typeof val === 'string') {
        coerced[param.key] = val === '' ? undefined : Number(val);
      } else {
        coerced[param.key] = val;
      }
    }
    onSubmit(coerced);
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-4">
      {intentType.parameters.map((param) => (
        <div key={param.key}>
          <Controller
            name={param.key}
            control={control}
            rules={{
              required: param.required ? `${param.label} is required` : undefined,
              ...(param.validation?.min !== undefined && {
                min: { value: param.validation.min, message: `Minimum value is ${param.validation.min}` },
              }),
              ...(param.validation?.max !== undefined && {
                max: { value: param.validation.max, message: `Maximum value is ${param.validation.max}` },
              }),
            }}
            render={({ field }) => {
              // Boolean -> checkbox
              if (param.type === 'boolean') {
                return (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-4 h-4 border border-surface-border text-brand-secondary focus:ring-brand-secondary"
                    />
                    <span className="text-sm text-content-primary">{param.label}</span>
                    {param.description && (
                      <span className="text-xs text-content-muted">({param.description})</span>
                    )}
                  </label>
                );
              }

              // Select / enum
              if (param.type === 'select' && param.options) {
                return (
                  <Select
                    label={param.label}
                    options={param.options.map((opt) => ({ value: opt, label: opt }))}
                    placeholder={param.description || `Select ${param.label}`}
                    value={String(field.value ?? '')}
                    onChange={field.onChange}
                    error={(errors[param.key]?.message as string) ?? undefined}
                  />
                );
              }

              // Number
              if (param.type === 'number') {
                return (
                  <Input
                    label={param.label}
                    type="number"
                    placeholder={param.description || ''}
                    value={String(field.value ?? '')}
                    onChange={field.onChange}
                    error={(errors[param.key]?.message as string) ?? undefined}
                  />
                );
              }

              // Text (default)
              return (
                <Input
                  label={param.label}
                  placeholder={param.description || ''}
                  value={String(field.value ?? '')}
                  onChange={field.onChange}
                  error={(errors[param.key]?.message as string) ?? undefined}
                />
              );
            }}
          />
        </div>
      ))}

      {!inline && (
        <Button type="submit">Submit</Button>
      )}
    </form>
  );
};

IntentSpecForm.displayName = 'IntentSpecForm';

export default IntentSpecForm;
