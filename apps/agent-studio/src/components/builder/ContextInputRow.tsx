import React from 'react';
import { cn } from '@airaie/ui';
import { Trash2 } from 'lucide-react';
import type { SchemaField, SchemaFieldType } from '@airaie/shared';

const fieldTypes: SchemaFieldType[] = ['string', 'number', 'boolean', 'object', 'array'];

export interface ContextInputRowProps {
  field: SchemaField;
  onChange: (updated: SchemaField) => void;
  onRemove: () => void;
}

const ContextInputRow: React.FC<ContextInputRowProps> = ({ field, onChange, onRemove }) => {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <input
        type="text"
        value={field.name}
        onChange={(e) => onChange({ ...field, name: e.target.value })}
        placeholder="field_name"
        className={cn(
          'min-w-0 w-1/4 h-8 px-2 text-sm bg-white border border-surface-border rounded-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary placeholder:text-content-muted'
        )}
      />
      <select
        value={field.type}
        onChange={(e) => onChange({ ...field, type: e.target.value as SchemaFieldType })}
        className={cn(
          'shrink-0 w-24 h-8 px-2 text-sm bg-white border border-surface-border rounded-none appearance-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary'
        )}
      >
        {fieldTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={field.description}
        onChange={(e) => onChange({ ...field, description: e.target.value })}
        placeholder="Description"
        className={cn(
          'min-w-0 flex-1 h-8 px-2 text-sm bg-white border border-surface-border rounded-none',
          'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
          'text-content-primary placeholder:text-content-muted'
        )}
      />
      <button
        onClick={onRemove}
        className="p-1.5 text-content-muted hover:text-status-danger transition-colors flex-shrink-0"
        title="Remove field"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

ContextInputRow.displayName = 'ContextInputRow';

export default ContextInputRow;
