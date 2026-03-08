import React, { useState, useMemo } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  AlertCircle, Brain, Search, Trash2, Tag, Clock, Star,
} from 'lucide-react';
import { Button, Badge, EmptyState, Spinner, Input, Select, formatRelativeTime } from '@airaie/ui';
import type { KernelAgentMemory } from '@airaie/shared';
import { useAgents } from '@hooks/useAgents';
import { useMemories, useDeleteMemory } from '@hooks/useMemories';
import { useExecutionStore } from '@store/executionStore';
import { cn } from '@airaie/ui';

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'fact', label: 'Fact' },
  { value: 'preference', label: 'Preference' },
  { value: 'lesson', label: 'Lesson' },
  { value: 'error_pattern', label: 'Error Pattern' },
];

const TYPE_COLORS: Record<string, string> = {
  fact: 'bg-blue-500',
  preference: 'bg-green-500',
  lesson: 'bg-amber-500',
  error_pattern: 'bg-red-500',
};

const TYPE_BADGE_MAP: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  fact: 'info',
  preference: 'success',
  lesson: 'warning',
  error_pattern: 'danger',
};

export default function MemoryPage() {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const setInspectorItem = useExecutionStore((s) => s.setInspectorItem);

  const { data: rawAgents } = useAgents();
  const agents = Array.isArray(rawAgents) ? rawAgents : [];
  const { data: rawMemories, isLoading, isError, refetch } = useMemories(selectedAgentId);
  const allMemories = Array.isArray(rawMemories) ? rawMemories : [];
  const deleteMutation = useDeleteMemory();

  const memories = useMemo(() => {
    let filtered = allMemories;
    if (typeFilter) filtered = filtered.filter((m) => m.memory_type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) => m.content.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allMemories, typeFilter, searchQuery]);

  const selectedMemory = memories.find((m) => m.id === selectedMemoryId);

  const agentOptions = [
    { value: '', label: 'Select an agent...' },
    ...agents.map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="h-full w-full overflow-hidden">
      <Group orientation="horizontal" id="memory-panels" className="h-full w-full">
        {/* Memory timeline (left) */}
        <Panel id="memory-list" defaultSize="35%" minSize="25%" maxSize="50%">
          <div className="flex flex-col h-full border-r border-gray-200">
            {/* Filters */}
            <div className="px-3 py-2 border-b border-gray-100 space-y-2 shrink-0">
              <Select options={agentOptions} value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} />
              <div className="flex gap-2">
                <Select options={TYPE_FILTERS} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} />
                <Input
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                />
              </div>
              <div className="text-[10px] text-gray-400">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
              </div>
            </div>

            {/* Memory list */}
            <div className="flex-1 overflow-y-auto">
              {!selectedAgentId && (
                <div className="px-3 py-8 text-center">
                  <EmptyState icon={Brain} heading="Select an agent" description="Choose an agent to browse memories." />
                </div>
              )}
              {selectedAgentId && isLoading && (
                <div className="flex justify-center py-8"><Spinner /></div>
              )}
              {selectedAgentId && isError && (
                <div className="flex flex-col items-center gap-2 py-8">
                  <AlertCircle size={20} className="text-red-500" />
                  <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
                </div>
              )}
              {selectedAgentId && !isLoading && !isError && memories.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <EmptyState icon={Brain} heading="No memories" description="Memories are created during agent runs." />
                </div>
              )}
              {memories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => {
                    setSelectedMemoryId(memory.id);
                    setInspectorItem({
                      type: 'memory',
                      id: memory.id,
                      name: memory.memory_type,
                      data: memory as unknown as Record<string, unknown>,
                    });
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                    selectedMemoryId === memory.id && 'bg-blue-50 border-l-2 border-l-blue-500'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full shrink-0', TYPE_COLORS[memory.memory_type] || 'bg-gray-300')} />
                    <Badge variant={TYPE_BADGE_MAP[memory.memory_type] ?? 'neutral'} badgeStyle="outline" className="text-[10px]">
                      {memory.memory_type}
                    </Badge>
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500 ml-auto">
                      <Star size={10} />
                      {memory.relevance.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{memory.content}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Clock size={10} />
                    {formatRelativeTime(memory.updated_at)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

        {/* Memory detail (center) */}
        <Panel id="memory-detail" defaultSize="65%" minSize="40%">
          <div className="h-full overflow-auto">
            {!selectedMemory ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                Select a memory to view details.
              </div>
            ) : (
              <div className="p-6 max-w-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={TYPE_BADGE_MAP[selectedMemory.memory_type] ?? 'neutral'} badgeStyle="outline">
                      {selectedMemory.memory_type}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-amber-500">
                      <Star size={14} />
                      <span className="font-medium tabular-nums">{selectedMemory.relevance.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      deleteMutation.mutate({ agentId: selectedAgentId, memoryId: selectedMemory.id });
                      setSelectedMemoryId(null);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Content</h3>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {selectedMemory.content}
                  </p>
                </div>

                {selectedMemory.tags.length > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Tags</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedMemory.tags.map((tag) => (
                        <Badge key={tag} variant="neutral" badgeStyle="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMemory.source_run_id && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Source Run</h3>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-mono text-xs text-gray-600">{selectedMemory.source_run_id}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    Created: {formatRelativeTime(selectedMemory.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    Updated: {formatRelativeTime(selectedMemory.updated_at)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </Group>
    </div>
  );
}
