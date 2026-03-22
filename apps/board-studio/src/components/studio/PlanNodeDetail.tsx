// ============================================================
// PlanNodeDetail — Inline detail panel shown below DAG on node click
// Supports read-only (default) and editing mode with parameter
// tweaks and tool swaps.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { Badge } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { PlanStep } from '@/types/board';

interface CompatibleTool {
  tool_id: string;
  name: string;
  tool_version: string;
}

interface PlanNodeDetailProps {
  step: PlanStep;
  onClose: () => void;
  // Editing props (all optional for backward compatibility)
  onStepEdit?: (
    stepId: string,
    changes: {
      parameters?: Record<string, unknown>;
      tool_id?: string;
      tool_version?: string;
    }
  ) => void;
  compatibleTools?: CompatibleTool[];
  editing?: boolean;
}

const stepStatusBadgeVariants: Record<string, BadgeVariant> = {
  pending: 'neutral',
  running: 'info',
  completed: 'success',
  failed: 'danger',
  draft: 'neutral',
};

const EDITABLE_STATUSES = new Set(['pending', 'draft']);

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Extract min/max from JSON Schema property definition */
function getSchemaConstraints(
  schema: Record<string, unknown> | undefined,
  key: string
): { min?: number; max?: number } {
  if (!schema) return {};
  const props = schema.properties as Record<string, any> | undefined;
  if (!props || !props[key]) return {};
  const prop = props[key];
  return {
    min: prop.minimum,
    max: prop.maximum,
  };
}

/** Check if a JSON Schema property is numeric */
function isNumericProperty(
  schema: Record<string, unknown> | undefined,
  key: string,
  value: unknown
): boolean {
  if (typeof value === 'number') return true;
  if (!schema) return false;
  const props = schema.properties as Record<string, any> | undefined;
  if (!props || !props[key]) return false;
  return props[key].type === 'number' || props[key].type === 'integer';
}

export default function PlanNodeDetail({
  step,
  onClose,
  onStepEdit,
  compatibleTools,
  editing: editingProp,
}: PlanNodeDetailProps) {
  const paramEntries = Object.entries(step.parameters ?? {}).filter(
    ([key]) => key !== 'outputs'
  );
  const outputs = step.parameters?.outputs;

  const canEdit =
    editingProp === true && EDITABLE_STATUSES.has(step.status);

  // Local state for edited parameters
  const [editedParams, setEditedParams] = useState<Record<string, unknown>>(
    () => ({ ...step.parameters })
  );

  // Validation state: track which keys have out-of-range values
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!canEdit) return errors;
    for (const [key, value] of Object.entries(editedParams)) {
      if (key === 'outputs') continue;
      if (typeof value !== 'number') continue;
      const { min, max } = getSchemaConstraints(step.parameter_schema, key);
      if (min !== undefined && value < min) {
        errors[key] = `Min: ${min}`;
      }
      if (max !== undefined && value > max) {
        errors[key] = `Max: ${max}`;
      }
    }
    return errors;
  }, [editedParams, canEdit, step.parameter_schema]);

  const hasErrors = Object.keys(validationErrors).length > 0;

  const handleParamChange = useCallback(
    (key: string, rawValue: string) => {
      const numVal = Number(rawValue);
      setEditedParams((prev) => ({
        ...prev,
        [key]: isNaN(numVal) ? rawValue : numVal,
      }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (hasErrors || !onStepEdit) return;
    onStepEdit(step.id, { parameters: editedParams });
  }, [hasErrors, onStepEdit, step.id, editedParams]);

  const handleCancel = useCallback(() => {
    setEditedParams({ ...step.parameters });
  }, [step.parameters]);

  const handleToolSwap = useCallback(
    (toolId: string) => {
      if (!onStepEdit || !compatibleTools) return;
      const tool = compatibleTools.find((t) => t.tool_id === toolId);
      if (tool) {
        onStepEdit(step.id, {
          tool_id: tool.tool_id,
          tool_version: tool.tool_version,
        });
      }
    },
    [onStepEdit, compatibleTools, step.id]
  );

  const showToolDropdown =
    canEdit && compatibleTools && compatibleTools.length >= 2;

  return (
    <div className="border border-surface-border bg-white rounded mt-2 max-h-48 overflow-y-auto">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-content-primary">
            {step.tool_name}
          </span>
          {step.tool_version && (
            <span className="text-[10px] text-content-muted">
              v{step.tool_version}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-content-muted hover:text-content-primary text-xs px-1"
        >
          Close
        </button>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-2">
        {/* Status + Duration row */}
        <div className="flex items-center gap-2">
          <Badge
            variant={stepStatusBadgeVariants[step.status] ?? 'neutral'}
            dot
            className="text-[10px]"
          >
            {step.status}
          </Badge>
          {step.duration_ms != null && (
            <span className="text-[10px] text-content-muted">
              {formatDuration(step.duration_ms)}
            </span>
          )}
        </div>

        {/* Tool swap dropdown */}
        {showToolDropdown && (
          <div>
            <span className="text-[10px] font-medium text-content-muted">
              Tool
            </span>
            <select
              className="mt-0.5 block w-full text-xs border border-surface-border rounded px-2 py-1 bg-white"
              value={step.tool_name}
              onChange={(e) => handleToolSwap(e.target.value)}
              aria-label="Select tool"
            >
              {compatibleTools!.map((tool) => (
                <option key={tool.tool_id} value={tool.tool_id}>
                  {tool.name} (v{tool.tool_version})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Inputs */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">
            Inputs
          </span>
          {paramEntries.length === 0 ? (
            <div className="text-xs text-content-tertiary">No parameters</div>
          ) : canEdit ? (
            /* Editable mode */
            <div className="space-y-1 mt-0.5">
              {paramEntries.map(([key, val]) => {
                const numeric = isNumericProperty(
                  step.parameter_schema,
                  key,
                  val
                );
                const { min, max } = getSchemaConstraints(
                  step.parameter_schema,
                  key
                );
                const currentVal = editedParams[key];
                const error = validationErrors[key];

                if (numeric) {
                  return (
                    <div key={key}>
                      <label className="flex items-center gap-2 text-xs">
                        <span className="text-content-muted w-24 truncate">
                          {key}:
                        </span>
                        <input
                          type="number"
                          className={`flex-1 border rounded px-1.5 py-0.5 text-xs ${
                            error
                              ? 'border-red-500'
                              : 'border-surface-border'
                          }`}
                          value={
                            currentVal !== undefined ? String(currentVal) : ''
                          }
                          onChange={(e) =>
                            handleParamChange(key, e.target.value)
                          }
                          min={min}
                          max={max}
                          step="any"
                        />
                      </label>
                      {error && (
                        <span className="text-[10px] text-red-500 ml-[104px]">
                          {error}
                        </span>
                      )}
                    </div>
                  );
                }

                // Non-numeric: read-only display
                return (
                  <div key={key} className="text-xs truncate">
                    <span className="text-content-muted">{key}:</span>{' '}
                    <span className="text-content-primary">
                      {typeof val === 'object'
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Read-only mode */
            <div className="space-y-0.5 mt-0.5">
              {paramEntries.map(([key, val]) => (
                <div key={key} className="text-xs truncate">
                  <span className="text-content-muted">{key}:</span>{' '}
                  <span className="text-content-primary">
                    {typeof val === 'object'
                      ? JSON.stringify(val)
                      : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save / Cancel buttons (only in editable mode) */}
        {canEdit && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={hasErrors}
              className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs px-2 py-0.5 border border-surface-border rounded text-content-muted hover:text-content-primary"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Outputs */}
        <div>
          <span className="text-[10px] font-medium text-content-muted">
            Outputs
          </span>
          {outputs ? (
            <div className="text-xs text-content-primary mt-0.5">
              {typeof outputs === 'object'
                ? JSON.stringify(outputs)
                : String(outputs)}
            </div>
          ) : (
            <div className="text-xs text-content-tertiary">
              Outputs determined at runtime
            </div>
          )}
        </div>

        {/* Error message */}
        {step.status === 'failed' && step.error && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {step.error}
          </div>
        )}

        {/* Logs placeholder */}
        <div className="text-[10px] text-content-tertiary italic">
          Logs available after execution
        </div>
      </div>
    </div>
  );
}
