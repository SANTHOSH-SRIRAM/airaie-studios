// ============================================================
// AgentAssignPanel — assign/view agent on an "agent" card type
// Shows current assignment + picker to change agent + link to Agent Studio
// ============================================================

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Spinner } from '@airaie/ui';
import { Bot, ExternalLink, Check } from 'lucide-react';
import apiClient from '@api/client';
import { updateCard } from '@api/cards';
import { safeOpen } from '@airaie/shared';
import { cardKeys } from '@hooks/useCards';

interface AgentSummary {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  latest_version?: number;
}

interface AgentVersion {
  version: number;
  status: string;
  created_at: string;
}

export interface AgentAssignPanelProps {
  cardId: string;
  boardId: string;
  agentId?: string;
  agentVersion?: number;
}

const AGENT_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENT_STUDIO_URL) ||
  'http://localhost:3002';

function useAgentsList() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ agents: AgentSummary[] }>('/agents');
      return data.agents ?? [];
    },
  });
}

function useAgentVersions(agentId: string | undefined) {
  return useQuery({
    queryKey: ['agent-versions', agentId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ versions: AgentVersion[] }>(
        `/agents/${agentId}/versions`
      );
      return data.versions ?? [];
    },
    enabled: !!agentId,
  });
}

const AgentAssignPanel: React.FC<AgentAssignPanelProps> = ({
  cardId,
  boardId,
  agentId,
  agentVersion,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(agentId);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(agentVersion);

  const qc = useQueryClient();
  const { data: agents, isLoading: agentsLoading } = useAgentsList();
  const { data: versions } = useAgentVersions(selectedAgentId);

  const assignMut = useMutation({
    mutationFn: () =>
      updateCard(cardId, {
        intent_spec_id: undefined,
        ...(selectedAgentId ? { agent_id: selectedAgentId } : {}),
        ...(selectedVersion ? { agent_version: selectedVersion } : {}),
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.detail(cardId) });
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });

  const publishedVersions = (versions ?? []).filter((v) => v.status === 'published');
  const selectedAgent = agents?.find((a) => a.id === selectedAgentId);
  const isAssigned = agentId && agentVersion;
  const hasChanges = selectedAgentId !== agentId || selectedVersion !== agentVersion;

  const openInStudio = () => {
    if (!selectedAgentId) return;
    const url = `${AGENT_STUDIO_URL}/builder/${selectedAgentId}?from=board`;
    safeOpen(url, '_blank', [AGENT_STUDIO_URL]);
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-6 space-y-2">
        <Bot size={24} className="mx-auto text-content-muted" />
        <p className="text-xs text-content-secondary">No agents available.</p>
        <button
          onClick={() => safeOpen(AGENT_STUDIO_URL, '_blank', [AGENT_STUDIO_URL])}
          className="text-xs text-brand-secondary hover:underline"
        >
          Create one in Agent Studio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Current assignment */}
      {isAssigned && (
        <div className="flex items-center gap-2 text-xs px-2 py-1.5 bg-green-50 border border-green-200">
          <Check size={12} className="text-green-600" />
          <span className="text-content-primary font-medium">{selectedAgent?.name ?? agentId}</span>
          <Badge variant="info" className="text-[9px]">v{agentVersion}</Badge>
          <button onClick={openInStudio} className="ml-auto text-content-muted hover:text-brand-secondary">
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {/* Agent selector */}
      <div>
        <label className="block text-[10px] text-content-muted uppercase tracking-wider font-semibold mb-1">
          Agent
        </label>
        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => {
                setSelectedAgentId(agent.id);
                setSelectedVersion(undefined);
              }}
              className={`
                flex items-center gap-2 text-left px-3 py-2 border transition-all text-xs
                ${selectedAgentId === agent.id
                  ? 'border-blue-500 bg-blue-50 text-content-primary'
                  : 'border-surface-border bg-white text-content-secondary hover:border-content-muted'
                }
              `}
            >
              <Bot size={12} className={selectedAgentId === agent.id ? 'text-blue-600' : 'text-content-muted'} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{agent.name}</div>
                {agent.description && (
                  <div className="text-[10px] text-content-muted truncate">{agent.description}</div>
                )}
              </div>
              <Badge variant="neutral" className="text-[8px] shrink-0">{agent.id}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Version selector */}
      {selectedAgentId && publishedVersions.length > 0 && (
        <div>
          <label className="block text-[10px] text-content-muted uppercase tracking-wider font-semibold mb-1">
            Version
          </label>
          <div className="flex flex-wrap gap-1">
            {publishedVersions.map((v) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setSelectedVersion(v.version)}
                className={`
                  px-2.5 py-1 border text-xs transition-all
                  ${selectedVersion === v.version
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-surface-border bg-white text-content-secondary hover:border-content-muted'
                  }
                `}
              >
                v{v.version}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedAgentId && publishedVersions.length === 0 && versions !== undefined && (
        <div className="text-xs text-content-muted px-2 py-1.5 bg-amber-50 border border-amber-200">
          No published versions. Publish a version in Agent Studio first.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {selectedAgentId && (
          <Button variant="ghost" size="sm" onClick={openInStudio} icon={ExternalLink}>
            Open in Studio
          </Button>
        )}
        {hasChanges && selectedAgentId && selectedVersion && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => assignMut.mutate()}
            loading={assignMut.isPending}
          >
            Assign Agent
          </Button>
        )}
      </div>
    </div>
  );
};

AgentAssignPanel.displayName = 'AgentAssignPanel';

export default AgentAssignPanel;
