// ============================================================
// MemoryPage — Agent memory browser with CRUD (/memory)
// ============================================================

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Brain,
  Plus,
  Trash2,
  Filter,
  Bot,
  BookOpen,
  Zap,
  Database,
} from 'lucide-react';
import { Badge, Button, Card, Spinner, EmptyState } from '@airaie/ui';
import type { BadgeVariant } from '@airaie/ui';
import apiClient from '@/api/client';
import { useAgentMemories, useCreateMemory, useDeleteMemory } from '@hooks/useMemory';
import type { AgentMemory, MemoryType } from '@/types/execution';
import { formatDateTime } from '@airaie/ui';

interface AgentSummary {
  id: string;
  name: string;
}

function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ agents: AgentSummary[] }>('/v0/agents');
      return data.agents ?? [];
    },
  });
}

const MEMORY_TYPE_CONFIG: Record<
  MemoryType,
  { label: string; icon: React.ElementType; variant: BadgeVariant }
> = {
  episodic: { label: 'Episodic', icon: Zap, variant: 'info' },
  semantic: { label: 'Semantic', icon: BookOpen, variant: 'success' },
  procedural: { label: 'Procedural', icon: Database, variant: 'warning' },
};

const MEMORY_TYPE_OPTIONS: { value: '' | MemoryType; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'episodic', label: 'Episodic' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'procedural', label: 'Procedural' },
];

function MemoryItem({
  memory,
  agentId,
}: {
  memory: AgentMemory;
  agentId: string;
}) {
  const deleteMutation = useDeleteMemory(agentId);
  const config = MEMORY_TYPE_CONFIG[memory.type] ?? MEMORY_TYPE_CONFIG.semantic;
  const Icon = config.icon;

  return (
    <Card>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={14} className="text-content-secondary" />
            <Badge variant={config.variant} className="text-[9px]">
              {config.label}
            </Badge>
            <span className="text-[10px] font-mono text-content-muted">
              {memory.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-content-muted">
              {formatDateTime(memory.created_at)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              className="text-red-500 hover:text-red-700"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(memory.id)}
            />
          </div>
        </div>
        <p className="text-sm text-content-primary whitespace-pre-wrap">
          {memory.content}
        </p>
        {memory.metadata && Object.keys(memory.metadata).length > 0 && (
          <div className="text-[10px] text-content-muted font-mono">
            {JSON.stringify(memory.metadata)}
          </div>
        )}
      </div>
    </Card>
  );
}

function CreateMemoryForm({
  agentId,
  onClose,
}: {
  agentId: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<MemoryType>('semantic');
  const [content, setContent] = useState('');
  const createMutation = useCreateMemory(agentId);

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;
    createMutation.mutate(
      { type, content: content.trim() },
      { onSuccess: () => { setContent(''); onClose(); } }
    );
  }, [type, content, createMutation, onClose]);

  return (
    <Card>
      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-content-primary">New Memory</span>
          <div className="flex gap-1 ml-auto">
            {(['episodic', 'semantic', 'procedural'] as MemoryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`text-[10px] px-2 py-0.5 border transition-colors ${
                  type === t
                    ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
                    : 'border-surface-border text-content-muted hover:text-content-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="w-full h-24 px-3 py-2 text-sm bg-white border border-surface-border text-content-primary placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-brand-secondary resize-none"
          placeholder="Memory content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!content.trim()}
            loading={createMutation.isPending}
            onClick={handleSubmit}
          >
            Save Memory
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function MemoryPage() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'' | MemoryType>('');
  const [showCreate, setShowCreate] = useState(false);

  const filterParams = typeFilter ? { type: typeFilter } : undefined;
  const {
    data: memories,
    isLoading: memoriesLoading,
  } = useAgentMemories(selectedAgentId || undefined, filterParams);

  // Auto-select first agent
  React.useEffect(() => {
    if (!selectedAgentId && agents && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={24} className="text-content-primary" />
          <h1 className="text-xl font-bold text-content-primary">Agent Memory</h1>
        </div>
        {selectedAgentId && (
          <Button
            icon={Plus}
            size="sm"
            onClick={() => setShowCreate(true)}
            disabled={showCreate}
          >
            Add Memory
          </Button>
        )}
      </div>

      {/* Agent selector */}
      {agentsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !agents || agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          heading="No agents found"
          description="Create an agent first to manage its memory."
        />
      ) : (
        <div className="flex items-center gap-3">
          <Bot size={14} className="text-content-muted" />
          <div className="flex gap-1">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => { setSelectedAgentId(agent.id); setShowCreate(false); }}
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  selectedAgentId === agent.id
                    ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
                    : 'border-surface-border text-content-muted hover:text-content-primary'
                }`}
              >
                {agent.name}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="ml-auto flex items-center gap-2">
            <Filter size={12} className="text-content-muted" />
            {MEMORY_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={`text-[10px] px-2 py-0.5 border transition-colors ${
                  typeFilter === opt.value
                    ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
                    : 'border-surface-border text-content-muted hover:text-content-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && selectedAgentId && (
        <CreateMemoryForm
          agentId={selectedAgentId}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Memory list */}
      {selectedAgentId && (
        memoriesLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !memories || memories.length === 0 ? (
          <EmptyState
            icon={Brain}
            heading="No memories yet"
            description="This agent has no stored memories. Add one to get started."
            action={
              <Button icon={Plus} size="sm" onClick={() => setShowCreate(true)}>
                Add Memory
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <span className="text-xs text-content-muted">
              {memories.length} memor{memories.length === 1 ? 'y' : 'ies'}
            </span>
            {memories.map((m) => (
              <MemoryItem key={m.id} memory={m} agentId={selectedAgentId} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
