import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Badge } from '@airaie/ui';
import { ExternalLink, Bot, Plus } from 'lucide-react';
import apiClient from '@/api/client';
import { safeOpen } from '@airaie/shared';

interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  created_at: string;
  updated_at: string;
}

const AGENT_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENT_STUDIO_URL) ||
  'http://localhost:3002';

function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ agents: AgentSummary[] }>('/agents');
      return data.agents ?? [];
    },
  });
}

export default function AgentsPage() {
  const { data: agents, isLoading, error } = useAgents();

  const openInStudio = (agentId?: string) => {
    const params = new URLSearchParams({ from: 'board' });
    if (agentId) params.set('agentId', agentId);
    const path = agentId ? `/builder/${agentId}` : '/';
    safeOpen(`${AGENT_STUDIO_URL}${path}?${params}`, '_blank', [AGENT_STUDIO_URL]);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-content-primary">Agents</h1>
          <p className="text-sm text-content-secondary mt-0.5">
            Autonomous agents that plan, propose, and execute actions.
          </p>
        </div>
        <button
          onClick={() => openInStudio()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-secondary hover:bg-brand-secondary/90 transition-colors"
        >
          <Plus size={14} />
          Open Agent Studio
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
          Failed to load agents.
        </div>
      )}

      {!isLoading && !error && (!agents || agents.length === 0) && (
        <div className="text-center py-16 space-y-3">
          <Bot size={40} className="mx-auto text-content-muted" />
          <p className="text-sm text-content-secondary">No agents yet.</p>
          <button
            onClick={() => openInStudio()}
            className="text-sm text-brand-secondary hover:underline"
          >
            Create your first agent
          </button>
        </div>
      )}

      {agents && agents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => openInStudio(agent.id)}
              className="text-left border border-surface-border bg-white p-4 hover:border-brand-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-content-muted" />
                <span className="text-sm font-medium text-content-primary truncate flex-1">
                  {agent.name}
                </span>
                <ExternalLink
                  size={12}
                  className="text-content-muted opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              {agent.description && (
                <p className="text-xs text-content-secondary line-clamp-2 mb-2">
                  {agent.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="neutral" badgeStyle="outline">
                  {agent.id}
                </Badge>
                {agent.owner && (
                  <span className="text-xs text-content-muted">{agent.owner}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
