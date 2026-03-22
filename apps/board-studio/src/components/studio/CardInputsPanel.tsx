// ============================================================
// CardInputsPanel — schema-driven input form for card config
// Reads inputSchema from the vertical registry, renders per-field
// ============================================================

import React, { useState, useCallback } from 'react';
import { Upload, Info } from 'lucide-react';
import { Button } from '@airaie/ui';
import type { InputSchemaSection, InputFieldDefinition } from '@/types/vertical-registry';

export interface CardInputsPanelProps {
  sections: InputSchemaSection[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readonly?: boolean;
}

// ─── Field renderers ─────────────────────────────────────────

function InputField({
  field,
  value,
  onChange,
  readonly,
}: {
  field: InputFieldDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  readonly?: boolean;
}) {
  const baseClass =
    'w-full border border-surface-border bg-white px-2.5 py-1.5 text-xs text-content-primary transition-colors focus:border-blue-400 focus:outline-none disabled:bg-slate-50 disabled:text-content-muted';

  switch (field.type) {
    case 'text':
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={readonly}
          className={baseClass}
        />
      );

    case 'number':
      return (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value != null ? Number(value) : ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={readonly}
            className={`${baseClass} flex-1`}
          />
          {field.unit && (
            <span className="text-[10px] text-content-muted shrink-0 w-10 text-right">{field.unit}</span>
          )}
        </div>
      );

    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          disabled={readonly}
          className={baseClass}
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'multiselect': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1">
          {(field.options ?? []).map((opt) => {
            const isOn = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={readonly}
                onClick={() => {
                  const next = isOn
                    ? selected.filter((v) => v !== opt.value)
                    : [...selected, opt.value];
                  onChange(next);
                }}
                className={`px-2 py-0.5 text-[10px] border transition-colors ${
                  isOn
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-surface-border bg-white text-content-secondary hover:border-content-muted'
                } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    }

    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readonly}
            className="h-3.5 w-3.5 accent-blue-600"
          />
          <span className="text-xs text-content-secondary">{field.label}</span>
        </label>
      );

    case 'artifact':
      return (
        <div
          className={`flex items-center gap-2 border border-dashed border-surface-border px-3 py-3 text-xs text-content-muted ${
            readonly ? 'bg-slate-50' : 'hover:border-blue-300 cursor-pointer'
          }`}
        >
          <Upload size={14} />
          {value ? (
            <span className="text-content-primary truncate">{String(value)}</span>
          ) : (
            <span>
              Drop file or click to upload
              {field.artifactTypes?.length
                ? ` (${field.artifactTypes.join(', ')})`
                : ''}
            </span>
          )}
        </div>
      );

    case 'json':
      return (
        <textarea
          value={typeof value === 'string' ? value : value != null ? JSON.stringify(value, null, 2) : ''}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          rows={4}
          disabled={readonly}
          placeholder={field.placeholder ?? field.description}
          className={`${baseClass} font-mono`}
        />
      );

    case 'range':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(value as { min?: number })?.min ?? ''}
            onChange={(e) =>
              onChange({ ...(value as object ?? {}), min: e.target.value ? Number(e.target.value) : undefined })
            }
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={readonly}
            className={`${baseClass} flex-1`}
            placeholder="Min"
          />
          <span className="text-[10px] text-content-muted">to</span>
          <input
            type="number"
            value={(value as { max?: number })?.max ?? ''}
            onChange={(e) =>
              onChange({ ...(value as object ?? {}), max: e.target.value ? Number(e.target.value) : undefined })
            }
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={readonly}
            className={`${baseClass} flex-1`}
            placeholder="Max"
          />
          {field.unit && <span className="text-[10px] text-content-muted shrink-0">{field.unit}</span>}
        </div>
      );

    case 'dataset':
      return (
        <div
          className={`flex items-center gap-2 border border-dashed border-surface-border px-3 py-3 text-xs text-content-muted ${
            readonly ? 'bg-slate-50' : 'hover:border-blue-300 cursor-pointer'
          }`}
        >
          <Upload size={14} />
          {value ? (
            <span className="text-content-primary truncate">{String(value)}</span>
          ) : (
            <span>Select dataset</span>
          )}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={readonly}
          className={baseClass}
        />
      );
  }
}

// ─── Section renderer ────────────────────────────────────────

function SectionBlock({
  section,
  values,
  onChange,
  readonly,
}: {
  section: InputSchemaSection;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readonly?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(section.collapsible ?? false);

  const visibleFields = section.fields.filter((f) => {
    if (!f.dependsOn) return true;
    return values[f.dependsOn] != null && values[f.dependsOn] !== '';
  });

  return (
    <div className="border border-surface-border">
      <button
        type="button"
        onClick={() => section.collapsible && setCollapsed(!collapsed)}
        className={`w-full text-left px-3 py-2 bg-slate-50/50 text-[10px] font-semibold text-content-secondary uppercase tracking-wider ${
          section.collapsible ? 'cursor-pointer hover:bg-slate-100/50' : 'cursor-default'
        }`}
      >
        {section.label}
      </button>
      {!collapsed && (
        <div className="px-3 py-2 space-y-2.5">
          {section.description && (
            <p className="flex items-start gap-1.5 text-[10px] text-content-muted">
              <Info size={10} className="shrink-0 mt-0.5" />
              {section.description}
            </p>
          )}
          {visibleFields.map((field) => (
            <div key={field.key}>
              {field.type !== 'boolean' && (
                <label className="block text-[10px] text-content-muted mb-0.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
              )}
              <InputField
                field={field}
                value={values[field.key]}
                onChange={(v) => onChange(field.key, v)}
                readonly={readonly}
              />
              {field.description && field.type !== 'json' && (
                <p className="text-[9px] text-content-muted mt-0.5">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────

const CardInputsPanel: React.FC<CardInputsPanelProps> = ({
  sections,
  values,
  onChange,
  readonly,
}) => {
  const handleSave = useCallback(() => {
    // Parent handles persistence via onChange per-field;
    // this could trigger a bulk save if needed
  }, []);

  if (sections.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-content-muted">
        No input schema defined for this intent type.
      </div>
    );
  }

  // Validation: count missing required fields
  const allFields = sections.flatMap((s) => s.fields);
  const requiredFields = allFields.filter((f) => f.required);
  const filledRequired = requiredFields.filter(
    (f) => values[f.key] != null && values[f.key] !== ''
  );
  const isComplete = filledRequired.length === requiredFields.length;

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          values={values}
          onChange={onChange}
          readonly={readonly}
        />
      ))}

      {!readonly && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-content-muted">
            {filledRequired.length}/{requiredFields.length} required fields
          </span>
          {isComplete && (
            <span className="text-[10px] text-green-600 font-medium">Ready</span>
          )}
        </div>
      )}
    </div>
  );
};

CardInputsPanel.displayName = 'CardInputsPanel';

export default CardInputsPanel;
