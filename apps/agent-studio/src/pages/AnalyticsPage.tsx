import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Activity, CheckCircle2, XCircle, Clock,
  DollarSign, Loader2, TrendingUp, TrendingDown,
} from 'lucide-react';
import { Spinner } from '@airaie/ui';
import { listRuns } from '@airaie/shared';
import { listAgents } from '@api/agents';
import { cn } from '@airaie/ui';

interface RunSummary {
  id: string;
  agent_id?: string;
  status: string;
  run_type?: string;
  cost_actual?: number;
  duration_ms?: number;
  started_at?: string;
  created_at: string;
}

interface AgentSummary {
  id: string;
  name: string;
}

function useAnalyticsData() {
  const runsQuery = useQuery({
    queryKey: ['analytics', 'runs'],
    queryFn: () => listRuns({ limit: 500 }),
    staleTime: 60_000,
  });
  const agentsQuery = useQuery({
    queryKey: ['analytics', 'agents'],
    queryFn: () => listAgents(),
    staleTime: 60_000,
  });
  return {
    runs: (runsQuery.data ?? []) as RunSummary[],
    agents: (agentsQuery.data ?? []) as AgentSummary[],
    isLoading: runsQuery.isLoading || agentsQuery.isLoading,
  };
}

function KPICard({ label, value, icon: Icon, color, trend }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', color)}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</div>
          {trend && (
            <div className={cn(
              'flex items-center gap-0.5 text-[10px] font-medium mt-0.5',
              trend.positive ? 'text-green-600' : 'text-red-500'
            )}>
              {trend.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HorizontalBar({ label, value, max, color, suffix }: {
  label: string; value: number; max: number; color: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 truncate text-gray-500">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-gray-500 tabular-nums">{value}{suffix}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { runs, agents, isLoading } = useAnalyticsData();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all');

  const agentMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agents) m.set(a.id, a.name);
    return m;
  }, [agents]);

  const filteredRuns = useMemo(() => {
    if (timeRange === 'all') return runs;
    const now = Date.now();
    const ms = timeRange === '7d' ? 7 * 86400_000 : 30 * 86400_000;
    return runs.filter((r) => now - new Date(r.created_at).getTime() < ms);
  }, [runs, timeRange]);

  const stats = useMemo(() => {
    const total = filteredRuns.length;
    const succeeded = filteredRuns.filter((r) => r.status === 'SUCCEEDED' || r.status === 'completed').length;
    const failed = filteredRuns.filter((r) => r.status === 'FAILED' || r.status === 'failed').length;
    const running = filteredRuns.filter((r) => r.status === 'RUNNING' || r.status === 'running').length;
    const totalCost = filteredRuns.reduce((sum, r) => sum + (r.cost_actual ?? 0), 0);
    const durations = filteredRuns.filter((r) => r.duration_ms != null).map((r) => r.duration_ms!);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 0;
    return { total, succeeded, failed, running, totalCost, avgDuration, successRate };
  }, [filteredRuns]);

  const agentBreakdown = useMemo(() => {
    const counts = new Map<string, { total: number; succeeded: number; cost: number }>();
    for (const r of filteredRuns) {
      const aid = r.agent_id ?? 'unknown';
      const prev = counts.get(aid) ?? { total: 0, succeeded: 0, cost: 0 };
      prev.total++;
      if (r.status === 'SUCCEEDED' || r.status === 'completed') prev.succeeded++;
      prev.cost += r.cost_actual ?? 0;
      counts.set(aid, prev);
    }
    return Array.from(counts.entries())
      .map(([id, data]) => ({ id, name: agentMap.get(id) ?? id.slice(0, 8), ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRuns, agentMap]);

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of filteredRuns) m.set(r.status.toLowerCase(), (m.get(r.status.toLowerCase()) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredRuns]);

  const maxCount = Math.max(...statusCounts.map(([, c]) => c), 1);
  const maxAgentCount = Math.max(...agentBreakdown.map((a) => a.total), 1);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Analytics</h1>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
            {(['7d', '30d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'text-xs px-3 py-1 rounded transition-colors',
                  timeRange === range
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <KPICard label="Total Runs" value={stats.total} icon={Activity} color="bg-blue-500" />
          <KPICard label="Succeeded" value={stats.succeeded} icon={CheckCircle2} color="bg-green-500" />
          <KPICard label="Failed" value={stats.failed} icon={XCircle} color="bg-red-500" />
          <KPICard label="Running" value={stats.running} icon={Loader2} color="bg-amber-500" />
          <KPICard label="Pass Rate" value={`${stats.successRate}%`} icon={TrendingUp} color="bg-emerald-600" />
          <KPICard label="Total Cost" value={`$${stats.totalCost.toFixed(2)}`} icon={DollarSign} color="bg-purple-500" />
          <KPICard
            label="Avg Duration"
            value={stats.avgDuration < 1000 ? `${stats.avgDuration}ms` : `${(stats.avgDuration / 1000).toFixed(1)}s`}
            icon={Clock}
            color="bg-slate-600"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Status Breakdown</h3>
            {statusCounts.length === 0 ? (
              <p className="text-xs text-gray-400">No data.</p>
            ) : (
              <div className="space-y-2">
                {statusCounts.map(([status, count]) => {
                  const colors: Record<string, string> = {
                    succeeded: 'bg-green-500', completed: 'bg-green-500',
                    failed: 'bg-red-500', running: 'bg-blue-500',
                    pending: 'bg-amber-400', canceled: 'bg-gray-400',
                  };
                  return <HorizontalBar key={status} label={status} value={count} max={maxCount} color={colors[status] ?? 'bg-gray-400'} />;
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Runs by Agent</h3>
            {agentBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400">No data.</p>
            ) : (
              <div className="space-y-2">
                {agentBreakdown.slice(0, 10).map((agent) => (
                  <HorizontalBar key={agent.id} label={agent.name} value={agent.total} max={maxAgentCount} color="bg-blue-500" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Cost by Agent</h3>
            {agentBreakdown.filter((a) => a.cost > 0).length === 0 ? (
              <p className="text-xs text-gray-400">No cost data.</p>
            ) : (
              <div className="space-y-2">
                {agentBreakdown.filter((a) => a.cost > 0).sort((a, b) => b.cost - a.cost).slice(0, 10).map((agent) => {
                  const maxCost = Math.max(...agentBreakdown.map((a) => a.cost), 0.01);
                  return <HorizontalBar key={agent.id} label={agent.name} value={parseFloat(agent.cost.toFixed(2))} max={maxCost} color="bg-purple-500" suffix="$" />;
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Success Rate by Agent</h3>
            {agentBreakdown.length === 0 ? (
              <p className="text-xs text-gray-400">No data.</p>
            ) : (
              <div className="space-y-2">
                {agentBreakdown.slice(0, 10).map((agent) => {
                  const rate = agent.total > 0 ? Math.round((agent.succeeded / agent.total) * 100) : 0;
                  return (
                    <HorizontalBar
                      key={agent.id}
                      label={agent.name}
                      value={rate}
                      max={100}
                      color={rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                      suffix="%"
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
