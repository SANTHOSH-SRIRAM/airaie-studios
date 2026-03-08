// ============================================================
// SchemaConfigEditor — schema-driven config form for intent types
// Falls back to raw JSON editor when no schema is available
// ============================================================

import React, { useState, useCallback } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@airaie/ui';
import { useUpdateCard } from '@hooks/useCards';
import type { IntentParameter } from '@/types/board';

interface SchemaConfigEditorProps {
  cardId: string;
  config: Record<string, unknown>;
  parameters: IntentParameter[];
  onSaved?: () => void;
}

const SchemaConfigEditor: React.FC<SchemaConfigEditorProps> = ({
  cardId,
  config,
  parameters,
  onSaved,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const updateCard = useUpdateCard();

  const handleStartEdit = useCallback(() => {
    // Populate draft from current config
    const initial: Record<string, unknown> = {};
    for (const param of parameters) {
      initial[param.key] = config[param.key] ?? param.default_value ?? '';
    }
    setDraft(initial);
    setEditing(true);
  }, [config, parameters]);

  const handleSave = useCallback(() => {
    // Merge draft into existing config
    const merged = { ...config, ...draft };
    updateCard.mutate(
      { id: cardId, config: merged },
      {
        onSuccess: () => {
          setEditing(false);
          onSaved?.();
        },
      }
    );
  }, [cardId, config, draft, updateCard, onSaved]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setDraft({});
  }, []);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  // --- Read-only view ---
  if (!editing) {
    return (
      <div className="space-y-2">
        {parameters.map((param) => {
          const value = config[param.key];
          return (
            <div key={param.key} className="flex justify-between items-start text-xs">
              <div className="flex flex-col">
                <span className="text-content-secondary font-medium">{param.label}</span>
                {param.description && (
                  <span className="text-[10px] text-content-muted">{param.description}</span>
                )}
              </div>
              <span className="font-medium text-content-primary studio-mono text-right ml-4">
                {value != null
                  ? typeof value === 'boolean'
                    ? value ? 'Yes' : 'No'
                    : String(value)
                  : '--'}
              </span>
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          className="text-[10px] mt-1"
        >
          Edit Parameters
        </Button>
      </div>
    );
  }

  // --- Edit view ---
  return (
    <div className="space-y-3">
      {parameters.map((param) => (
        <div key={param.key}>
          <label className="block text-[11px] font-medium text-content-secondary mb-1">
            {param.label}
            {param.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>

          {param.type === 'select' && param.options ? (
            <select
              value={String(draft[param.key] ?? '')}
              onChange={(e) => handleFieldChange(param.key, e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white
                text-content-primary focus:outline-none focus:border-blue-500"
            >
              <option value="">Select...</option>
              {param.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : param.type === 'boolean' ? (
            <button
              type="button"
              onClick={() => handleFieldChange(param.key, !draft[param.key])}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${draft[param.key] ? 'bg-blue-600' : 'bg-gray-200'}
              `}
              role="switch"
              aria-checked={!!draft[param.key]}
              aria-label={param.label}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform
                  ${draft[param.key] ? 'translate-x-[18px]' : 'translate-x-[3px]'}
                `}
              />
            </button>
          ) : param.type === 'number' ? (
            <input
              type="number"
              value={String(draft[param.key] ?? '')}
              onChange={(e) => handleFieldChange(param.key, e.target.value ? Number(e.target.value) : '')}
              min={param.validation?.min}
              max={param.validation?.max}
              className="w-full px-2 py-1.5 text-xs studio-mono border border-surface-border bg-white
                text-content-primary focus:outline-none focus:border-blue-500"
              aria-label={param.label}
            />
          ) : (
            <input
              type="text"
              value={String(draft[param.key] ?? '')}
              onChange={(e) => handleFieldChange(param.key, e.target.value)}
              placeholder={param.description}
              className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white
                text-content-primary focus:outline-none focus:border-blue-500"
              aria-label={param.label}
            />
          )}

          {param.description && (
            <p className="text-[10px] text-content-muted mt-0.5">{param.description}</p>
          )}
        </div>
      ))}

      <div className="flex items-center gap-1.5 pt-1">
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          onClick={handleSave}
          loading={updateCard.isPending}
          className="text-[10px]"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          onClick={handleCancel}
          className="text-[10px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

SchemaConfigEditor.displayName = 'SchemaConfigEditor';

export default SchemaConfigEditor;
