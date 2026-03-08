import React from 'react';
import {
  Plus, AlertCircle, Bot, MoreHorizontal, Clock, MessageSquare,
} from 'lucide-react';
import { Button, Card, Badge, EmptyState, formatRelativeTime } from '@airaie/ui';
import { useAgents } from '@hooks/useAgents';
import { useRuns } from '@hooks/useRuns';
import { useUIStore } from '@store/uiStore';
import { useSpecStore } from '@store/specStore';
import { useIDEStore } from '@store/ideStore';
import type { KernelAgent, KernelRun } from '@airaie/shared';

function SkeletonCard() {
  return (
    <div className="bg-surface-card border border-surface-border shadow-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 w-3/4" />
      <div className="h-3 bg-slate-200 w-full" />
      <div className="flex gap-2"><div className="h-5 bg-slate-200 w-16" /></div>
      <div className="flex justify-between">
        <div className="h-3 bg-slate-200 w-16" />
        <div className="h-3 bg-slate-200 w-12" />
      </div>
    </div>
  );
}

function getTrustBadge(runs: KernelRun[]): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } | null {
  if (runs.length === 0) return null;
  const succeeded = runs.filter((r) => r.status === 'SUCCEEDED').length;
  const rate = succeeded / runs.length;
  if (rate >= 0.9) return { label: `${Math.round(rate * 100)}%`, variant: 'success' };
  if (rate >= 0.7) return { label: `${Math.round(rate * 100)}%`, variant: 'warning' };
  return { label: `${Math.round(rate * 100)}%`, variant: 'danger' };
}

function AgentCard({ agent, runs }: { agent: KernelAgent; runs: KernelRun[] }) {
  const setActiveView = useIDEStore((s) => s.setActiveView);
  const agentRuns = runs.filter((r) => r.agent_id === agent.id);
  const runCount = agentRuns.length;
  const lastRun = agentRuns.length > 0
    ? agentRuns.reduce((latest, r) => (r.created_at > latest.created_at ? r : latest))
    : null;
  const trustBadge = getTrustBadge(agentRuns);

  return (
    <Card
      hover
      className="cursor-pointer"
      onClick={() => {
        useUIStore.getState().setAgentId(agent.id);
        setActiveView('builder');
      }}
    >
      <Card.Body className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={16} className="text-brand-secondary shrink-0" />
            <h3 className="text-sm font-semibold text-content-primary truncate">{agent.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {trustBadge && <Badge variant={trustBadge.variant}>{trustBadge.label}</Badge>}
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-content-muted hover:text-content-primary transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {agent.description && (
          <p className="text-xs text-content-secondary line-clamp-2">{agent.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-content-tertiary">
          <span className="font-mono text-content-muted">{agent.owner}</span>
          <div className="flex items-center gap-3">
            {runCount > 0 && (
              <span className="tabular-nums">{runCount} run{runCount !== 1 ? 's' : ''}</span>
            )}
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{lastRun ? formatRelativeTime(lastRun.created_at) : formatRelativeTime(agent.updated_at)}</span>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function StatsCard({ agents }: { agents: KernelAgent[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-bg">
        <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider">Overview</h2>
      </div>
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">Total Agents</p>
            <p className="text-lg font-semibold text-content-primary font-mono mt-1">{agents.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">Builder</p>
            <p className="text-lg font-semibold text-brand-secondary font-mono mt-1">
              <Bot size={18} className="inline -mt-0.5" />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">Playground</p>
            <p className="text-lg font-semibold text-status-info font-mono mt-1">
              <MessageSquare size={18} className="inline -mt-0.5" />
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const setActiveView = useIDEStore((s) => s.setActiveView);
  const { data: rawAgents, isLoading, isError, refetch } = useAgents();
  const { data: rawRuns } = useRuns();
  const agents = Array.isArray(rawAgents) ? rawAgents : [];
  const runs = Array.isArray(rawRuns) ? rawRuns : [];

  const handleNewAgent = () => {
    useUIStore.getState().setAgentId('');
    useSpecStore.getState().reset();
    setActiveView('builder');
  };

  return (
    <div className="p-6 space-y-6 min-h-full bg-grid">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Agents</h1>
          <p className="text-sm text-content-secondary mt-1">Build, deploy, and monitor intelligent agents.</p>
        </div>
        <Button icon={Plus} onClick={handleNewAgent}>New Agent</Button>
      </div>

      <StatsCard agents={agents} />

      <div>
        <h2 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-4">All Agents</h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-12">
            <AlertCircle size={32} className="text-status-danger" />
            <p className="text-sm text-content-secondary">Failed to load agents.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && agents.length === 0 && (
          <EmptyState
            icon={Bot}
            heading="No agents yet"
            description="Create your first agent to start building intelligent automation."
            action={<Button icon={Plus} onClick={handleNewAgent}>Create your first agent</Button>}
          />
        )}

        {!isLoading && !isError && agents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => <AgentCard key={agent.id} agent={agent} runs={runs} />)}
          </div>
        )}
      </div>
    </div>
  );
}
