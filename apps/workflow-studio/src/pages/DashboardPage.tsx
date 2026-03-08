// ============================================================
// DashboardPage — workflow list with grid view, status, and actions
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  AlertCircle,
  Workflow,
  MoreHorizontal,
  Play,
  GitBranch,
  Clock,
} from 'lucide-react';
import { Button, Card, Badge, EmptyState, Spinner, formatRelativeTime } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import { useWorkflows, useWorkflowVersions } from '@hooks/useWorkflows';
import { useRuns } from '@hooks/useRuns';
import StartRunDialog from '@components/runs/StartRunDialog';
import type { KernelWorkflow, KernelRun } from '@airaie/shared';

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'SUCCEEDED':
      return 'success';
    case 'RUNNING':
      return 'info';
    case 'FAILED':
      return 'danger';
    case 'PENDING':
    case 'AWAITING_APPROVAL':
      return 'warning';
    default:
      return 'neutral';
  }
}

function SkeletonCard() {
  return (
    <div className="bg-surface-card border border-surface-border shadow-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 w-3/4" />
      <div className="h-3 bg-slate-200 w-full" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-200 w-16" />
        <div className="h-5 bg-slate-200 w-14" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 bg-slate-200 w-16" />
        <div className="h-3 bg-slate-200 w-12" />
      </div>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: KernelWorkflow }) {
  const navigate = useNavigate();
  const [showRunDialog, setShowRunDialog] = useState(false);
  const { data: rawVersions } = useWorkflowVersions(workflow.id);
  const versions = Array.isArray(rawVersions) ? rawVersions : [];
  const versionOptions = versions.map((v: any) => ({
    value: String(v.version ?? v.id),
    label: `v${v.version ?? v.id}${v.status === 'published' ? ' (published)' : ''}`,
  }));

  return (
    <>
      <Card hover className="cursor-pointer" onClick={() => navigate('/builder')}>
        <Card.Body className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Workflow size={16} className="text-brand-secondary shrink-0" />
              <h3 className="text-sm font-semibold text-content-primary truncate">
                {workflow.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRunDialog(true);
                }}
                className="p-1 text-content-muted hover:text-brand-secondary transition-colors"
                title="Run workflow"
              >
                <Play size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-content-muted hover:text-content-primary transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>

          {workflow.description && (
            <p className="text-xs text-content-secondary line-clamp-2">
              {workflow.description}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-content-tertiary">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatRelativeTime(workflow.updated_at)}</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {showRunDialog && versionOptions.length > 0 && (
        <StartRunDialog
          open={showRunDialog}
          onClose={() => setShowRunDialog(false)}
          workflowId={workflow.id}
          workflowName={workflow.name}
          versions={versionOptions}
          onRunCreated={() => setShowRunDialog(false)}
        />
      )}
    </>
  );
}

function RecentRunsCard({ runs }: { runs: KernelRun[] }) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-bg">
        <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">
          Recent Runs
        </h2>
        <Badge variant="info" badgeStyle="outline">
          {safeRuns.length} runs
        </Badge>
      </div>
      <div className="px-5 py-3">
        {safeRuns.length === 0 ? (
          <p className="text-xs text-content-muted py-4 text-center">No runs yet</p>
        ) : (
          <div className="space-y-0">
            {safeRuns.slice(0, 5).map((run, i) => (
              <div
                key={run.id}
                className={`flex items-center gap-3 py-3 px-2 -mx-2 hover:bg-surface-hover transition-colors cursor-pointer ${
                  i < Math.min(safeRuns.length, 5) - 1 ? 'border-b border-surface-border' : ''
                }`}
              >
                <Badge variant={statusVariant(run.status)} dot>
                  {run.status}
                </Badge>
                <span className="text-xs text-content-secondary font-mono truncate flex-1">
                  {run.id.slice(0, 8)}
                </span>
                <span className="text-xs text-content-muted">
                  {run.started_at ? formatRelativeTime(run.started_at) : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatsCard({ workflows, runs }: { workflows: KernelWorkflow[]; runs: KernelRun[] }) {
  const safeRuns = Array.isArray(runs) ? runs : [];
  const completed = safeRuns.filter((r) => r.status === 'SUCCEEDED').length;
  const failed = safeRuns.filter((r) => r.status === 'FAILED').length;
  const running = safeRuns.filter((r) => r.status === 'RUNNING').length;

  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-bg">
        <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">
          Overview
        </h2>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">
              Workflows
            </p>
            <p className="text-lg font-semibold text-content-primary font-mono mt-1">
              {workflows.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">
              Running
            </p>
            <p className="text-lg font-semibold text-brand-secondary font-mono mt-1">{running}</p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">
              Completed
            </p>
            <p className="text-lg font-semibold text-status-success font-mono mt-1">{completed}</p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">
              Failed
            </p>
            <p className="text-lg font-semibold text-status-danger font-mono mt-1">{failed}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: rawWorkflows, isLoading, isError, refetch } = useWorkflows();
  const { data: rawRuns } = useRuns({ limit: 10, run_type: 'workflow' });
  const workflows = Array.isArray(rawWorkflows) ? rawWorkflows : [];
  const runs = Array.isArray(rawRuns) ? rawRuns : [];

  return (
    <div className="p-6 space-y-6 min-h-full bg-grid">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Workflows</h1>
          <p className="text-sm text-content-secondary mt-1">
            Create, monitor, and manage automation workflows.
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/builder')}>
          New Workflow
        </Button>
      </div>

      {/* Stats + Recent Runs */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <StatsCard workflows={workflows} runs={runs} />
        </div>
        <RecentRunsCard runs={runs} />
      </div>

      {/* Workflow Grid */}
      <div>
        <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-4">
          All Workflows
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-12">
            <AlertCircle size={32} className="text-status-danger" />
            <p className="text-sm text-content-secondary">Failed to load workflows.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoading && !isError && workflows.length === 0 && (
          <EmptyState
            icon={Workflow}
            heading="No workflows yet"
            description="Create your first workflow to start automating."
            action={
              <Button icon={Plus} onClick={() => navigate('/builder')}>
                Create your first workflow
              </Button>
            }
          />
        )}

        {!isLoading && !isError && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <WorkflowCard key={wf.id} workflow={wf} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
