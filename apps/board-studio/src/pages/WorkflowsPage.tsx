import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Badge } from '@airaie/ui';
import { ExternalLink, Workflow, Plus } from 'lucide-react';
import apiClient from '@/api/client';
import { safeOpen } from '@airaie/shared';

interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const WORKFLOW_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORKFLOW_STUDIO_URL) ||
  'http://localhost:3001';

function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ workflows: WorkflowSummary[] }>('/v0/workflows');
      return data.workflows ?? [];
    },
  });
}

export default function WorkflowsPage() {
  const { data: workflows, isLoading, error } = useWorkflows();

  const openInStudio = (workflowId?: string) => {
    const params = new URLSearchParams({ from: 'board' });
    if (workflowId) params.set('workflowId', workflowId);
    const path = workflowId ? `/builder/${workflowId}` : '/';
    safeOpen(`${WORKFLOW_STUDIO_URL}${path}?${params}`, '_blank', [WORKFLOW_STUDIO_URL]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-content-primary">Workflows</h1>
          <p className="text-sm text-content-secondary mt-0.5">
            Automated execution pipelines linked to board cards.
          </p>
        </div>
        <button
          onClick={() => openInStudio()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary/90 transition-colors"
        >
          <Plus size={14} />
          Open Workflow Studio
          <ExternalLink size={12} />
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-sm text-status-danger">
          Failed to load workflows.
        </div>
      )}

      {!isLoading && !error && (!workflows || workflows.length === 0) && (
        <div className="text-center py-16 space-y-3">
          <Workflow size={40} className="mx-auto text-content-muted" />
          <p className="text-sm text-content-secondary">No workflows yet.</p>
          <button
            onClick={() => openInStudio()}
            className="text-sm text-brand-secondary hover:underline"
          >
            Create your first workflow
          </button>
        </div>
      )}

      {workflows && workflows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => openInStudio(wf.id)}
              className="text-left border border-surface-border bg-white p-4 hover:border-brand-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Workflow size={14} className="text-content-muted" />
                <span className="text-sm font-medium text-content-primary truncate flex-1">
                  {wf.name}
                </span>
                <ExternalLink
                  size={12}
                  className="text-content-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              {wf.description && (
                <p className="text-xs text-content-secondary line-clamp-2 mb-2">
                  {wf.description}
                </p>
              )}
              <Badge variant="neutral" badgeStyle="outline">
                {wf.id}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
