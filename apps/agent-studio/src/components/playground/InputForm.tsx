import React, { useState } from 'react';
import { cn, Button, Input, CodeEditor } from '@airaie/ui';
import { Send } from 'lucide-react';
import type { ContextSchema } from '@airaie/shared';

export interface InputFormProps {
  schema: ContextSchema;
  onSubmit: (values: Record<string, unknown>) => void;
  disabled?: boolean;
  className?: string;
}

const InputForm: React.FC<InputFormProps> = ({ schema, onSubmit, disabled, className }) => {
  const allFields = [...schema.required_inputs, ...schema.optional_inputs];
  const [values, setValues] = useState<Record<string, unknown>>({});

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  if (allFields.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 p-4 border-b border-surface-border bg-slate-50', className)}>
      <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">Context Inputs</span>
      <div className="space-y-2">
        {allFields.map((field) => {
          if (field.type === 'boolean') {
            return (
              <label key={field.name} className="flex items-center gap-2 text-sm text-content-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!values[field.name]}
                  onChange={(e) => setValue(field.name, e.target.checked)}
                  className="w-4 h-4 accent-brand-secondary"
                  disabled={disabled}
                />
                {field.name}
                {field.description && <span className="text-xs text-content-muted">— {field.description}</span>}
              </label>
            );
          }
          if (field.type === 'number') {
            return (
              <Input
                key={field.name}
                label={field.name}
                type="number"
                value={(values[field.name] as string) ?? ''}
                onChange={(e) => setValue(field.name, parseFloat(e.target.value))}
                placeholder={field.description}
                disabled={disabled}
              />
            );
          }
          if (field.type === 'object' || field.type === 'array') {
            return (
              <div key={field.name} className="space-y-1">
                <label className="text-sm font-medium text-content-primary">{field.name}</label>
                <CodeEditor
                  value={(values[field.name] as string) ?? '{}'}
                  onChange={(v) => setValue(field.name, v)}
                  language="json"
                  minLines={3}
                />
              </div>
            );
          }
          return (
            <Input
              key={field.name}
              label={field.name}
              value={(values[field.name] as string) ?? ''}
              onChange={(e) => setValue(field.name, e.target.value)}
              placeholder={field.description}
              disabled={disabled}
            />
          );
        })}
      </div>
      <Button type="submit" variant="primary" size="sm" icon={Send} disabled={disabled}>
        Submit
      </Button>
    </form>
  );
};

InputForm.displayName = 'InputForm';

export default InputForm;
