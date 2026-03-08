// ============================================================
// PlanViewer — Horizontal pipeline view with parameter editing
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  ShieldCheck,
  Layers,
  Cpu,
  BarChart3,
  FileText,
  ClipboardCheck,
  UserCheck,
  Lock,
  Pencil,
  Save,
  X,
  ChevronRight,
} from 'lucide-react';
import { Badge, Button } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import type { PlanStep } from '@/types/board';
import type { PlanResponse } from '@api/plans';

export interface PlanViewerProps {
  plan: PlanResponse;
  onEditStep?: (stepId: string, parameters: Record<string, unknown>) => void;
  readonly?: boolean;
}

// --- Role → icon mapping ---

const roleIcons: Record<string, typeof Cpu> = {
  validate_input: ShieldCheck,
  preprocess: Layers,
  solve: Cpu,
  postprocess: BarChart3,
  report: FileText,
  evidence: ClipboardCheck,
  approval: UserCheck,
};

// --- Status → style mapping ---

const statusStyles: Record<string, { bg: string; border: string; badge: BadgeVariant }> = {
  pending: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'neutral' },
  running: { bg: 'bg-blue-50', border: 'border-blue-300', badge: 'info' },
  completed: { bg: 'bg-green-50', border: 'border-green-300', badge: 'success' },
  failed: { bg: 'bg-red-50', border: 'border-red-300', badge: 'danger' },
  skipped: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'neutral' },
  draft: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'neutral' },
};

const planStatusBadge: Record<string, BadgeVariant> = {
  draft: 'neutral',
  validated: 'info',
  executing: 'warning',
  completed: 'success',
  failed: 'danger',
};

// --- Parameter editor ---

function ParamEditor({
  step,
  onSave,
  onCancel,
}: {
  step: PlanStep;
  onSave: (params: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [params, setParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [k, v] of Object.entries(step.parameters)) {
      initial[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    return initial;
  });

  const handleSave = () => {
    const parsed: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      try {
        parsed[k] = JSON.parse(v);
      } catch {
        parsed[k] = v;
      }
    }
    onSave(parsed);
  };

  const entries = Object.entries(params);

  return (
    <div className="mt-3 p-3 border border-blue-200 bg-blue-50/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-content-secondary uppercase tracking-wider">
          Parameters
        </span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={X} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="text-[11px] text-content-tertiary">No parameters</p>
      ) : (
        entries.map(([key, val]) => (
          <div key={key}>
            <label className="text-[10px] text-content-muted block mb-0.5">{key}</label>
            <input
              type="text"
              value={val}
              onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full text-xs border border-surface-border px-2 py-1 bg-white text-content-primary focus:outline-none focus:ring-1 focus:ring-brand-secondary"
            />
          </div>
        ))
      )}
    </div>
  );
}

// --- Pipeline node ---

function PipelineNode({
  step,
  isExpanded,
  onToggle,
  onEditStep,
  readonly,
}: {
  step: PlanStep;
  isExpanded: boolean;
  onToggle: () => void;
  onEditStep?: (stepId: string, parameters: Record<string, unknown>) => void;
  readonly?: boolean;
}) {
  const status = step.status ?? 'pending';
  const style = statusStyles[status] ?? statusStyles.pending;
  const Icon = roleIcons[step.role] ?? Cpu;
  const isRunning = status === 'running';
  const hasSchema = !!step.parameter_schema;
  const canEdit = !readonly && (status === 'pending' || status === 'draft');

  return (
    <div className="flex flex-col items-center min-w-[140px] max-w-[160px]">
      <button
        type="button"
        onClick={canEdit ? onToggle : undefined}
        className={`
          w-full p-2.5 border transition-all text-left
          ${style.bg} ${style.border}
          ${isRunning ? 'animate-pulse' : ''}
          ${canEdit ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}
        `}
      >
        {/* Icon + tool name */}
        <div className="flex items-center gap-1.5">
          <Icon size={13} className="text-content-secondary shrink-0" />
          <span className="text-[11px] font-medium text-content-primary truncate">
            {step.tool_name}
          </span>
          {!canEdit && <Lock size={10} className="text-content-muted shrink-0" />}
          {canEdit && <Pencil size={9} className="text-content-muted shrink-0" />}
        </div>

        {/* Role */}
        <div className="text-[10px] text-content-muted mt-0.5">{step.role}</div>

        {/* Version */}
        {step.tool_version && (
          <div className="text-[9px] text-content-muted mt-0.5">v{step.tool_version}</div>
        )}

        {/* Status badge */}
        <div className="mt-1.5">
          <Badge variant={style.badge} dot className="text-[9px]">
            {status}
          </Badge>
        </div>
      </button>

      {/* Parameter editor (expanded) */}
      {isExpanded && canEdit && onEditStep && (
        <ParamEditor
          step={step}
          onSave={(params) => {
            onEditStep(step.id, params);
            onToggle();
          }}
          onCancel={onToggle}
        />
      )}
    </div>
  );
}

// --- Main component ---

const PlanViewer: React.FC<PlanViewerProps> = ({ plan, onEditStep, readonly }) => {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const toggleStep = useCallback(
    (stepId: string) => {
      setExpandedStepId((prev) => (prev === stepId ? null : stepId));
    },
    []
  );

  const steps = plan.steps ?? [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
          Execution Plan
        </h3>
        <Badge variant={planStatusBadge[plan.status] ?? 'neutral'} className="text-[10px]">
          {plan.status}
        </Badge>
      </div>

      {/* Pipeline (horizontal scroll) */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-1">
          {steps.map((step, i) => (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div className="flex items-center self-center pt-2">
                  <ChevronRight size={14} className="text-content-muted" />
                </div>
              )}
              <PipelineNode
                step={step}
                isExpanded={expandedStepId === step.id}
                onToggle={() => toggleStep(step.id)}
                onEditStep={onEditStep}
                readonly={readonly}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-[11px] text-content-muted pt-1 border-t border-surface-border">
        {plan.cost_estimate && (
          <span>Cost: ~{plan.cost_estimate}</span>
        )}
        {plan.time_estimate && (
          <span>Time: ~{plan.time_estimate}</span>
        )}
        <span>Steps: {steps.length}</span>
      </div>
    </div>
  );
};

PlanViewer.displayName = 'PlanViewer';

export default PlanViewer;
