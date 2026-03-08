import { useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronUp, Radio, FileText, AlertTriangle,
  Package, DollarSign, Terminal, Trash2, Download, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useIDEStore } from '@store/ideStore';
import { useExecutionStore } from '@store/executionStore';
import type { LogEntry, Artifact, NetworkRequest } from '@store/executionStore';
import { Badge, cn } from '@airaie/ui';

const tabs = [
  { id: 'execution' as const, label: 'Execution', icon: Radio },
  { id: 'logs' as const, label: 'Logs', icon: FileText },
  { id: 'problems' as const, label: 'Problems', icon: AlertTriangle },
  { id: 'artifacts' as const, label: 'Artifacts', icon: Package },
  { id: 'cost' as const, label: 'Cost', icon: DollarSign },
  { id: 'terminal' as const, label: 'Network', icon: Terminal },
] as const;

export default function BottomPanel() {
  const bottomTab = useIDEStore((s) => s.bottomTab);
  const bottomCollapsed = useIDEStore((s) => s.bottomCollapsed);
  const setBottomTab = useIDEStore((s) => s.setBottomTab);
  const toggleBottom = useIDEStore((s) => s.toggleBottom);
  const events = useExecutionStore((s) => s.events);
  const problems = useExecutionStore((s) => s.problems);
  const logs = useExecutionStore((s) => s.logs);
  const networkRequests = useExecutionStore((s) => s.networkRequests);

  const runningCount = useMemo(() => {
    const started = new Set<string>();
    const finished = new Set<string>();
    for (const e of events) {
      if (e.nodeId && e.type.includes('STARTED')) started.add(e.nodeId);
      if (e.nodeId && (e.type.includes('COMPLETED') || e.type.includes('FAILED'))) finished.add(e.nodeId);
    }
    return [...started].filter((id) => !finished.has(id)).length;
  }, [events]);

  const badgeCounts: Record<string, number> = {
    execution: runningCount,
    problems: problems.length,
    logs: logs.length,
    terminal: networkRequests.filter((r) => r.error || (r.status && r.status >= 400)).length,
  };

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white h-full">
      <div className="flex items-center h-9 border-b border-gray-100 px-2 gap-1 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = bottomTab === tab.id;
          const count = badgeCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon size={13} />
              {tab.label}
              {count > 0 && (
                <Badge
                  variant={tab.id === 'problems' || tab.id === 'terminal' ? 'danger' : 'info'}
                  badgeStyle="outline"
                  className="text-[9px] px-1 py-0 min-w-0"
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={toggleBottom}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          aria-label={bottomCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {bottomCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!bottomCollapsed && (
        <div className="flex-1 overflow-auto min-h-0">
          {bottomTab === 'execution' && <ExecutionStreamPanel />}
          {bottomTab === 'logs' && <LogsPanel />}
          {bottomTab === 'problems' && <ProblemsPanel />}
          {bottomTab === 'artifacts' && <ArtifactsPanel />}
          {bottomTab === 'cost' && <CostPanel />}
          {bottomTab === 'terminal' && <NetworkPanel />}
        </div>
      )}
    </div>
  );
}

/* ─── Execution Stream ─── */

function ExecutionStreamPanel() {
  const events = useExecutionStore((s) => s.events);
  const clearEvents = useExecutionStore((s) => s.clearEvents);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) {
    return <div className="p-3 text-xs text-gray-400 font-mono">No active execution. Run an agent to see events here.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-50">
        <span className="text-[10px] text-gray-400">{events.length} events</span>
        <button onClick={clearEvents} className="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Clear events">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-0.5 font-mono text-xs">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded">
            <span className="text-gray-400 w-16 shrink-0 tabular-nums">
              {new Date(ev.timestamp).toLocaleTimeString()}
            </span>
            <Badge
              variant={
                ev.type.includes('FAILED') ? 'danger' :
                ev.type.includes('COMPLETED') || ev.type.includes('SUCCEEDED') ? 'success' :
                ev.type.includes('STARTED') || ev.type.includes('RUNNING') ? 'info' :
                'neutral'
              }
              badgeStyle="outline"
              className="text-[10px]"
            >
              {ev.type}
            </Badge>
            {ev.nodeId && <span className="text-blue-500">{ev.nodeId}</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ─── Logs ─── */

const levelColors: Record<string, string> = {
  stdout: 'text-gray-700',
  stderr: 'text-red-600',
  info: 'text-blue-600',
  debug: 'text-gray-500',
};

function LogsPanel() {
  const logs = useExecutionStore((s) => s.logs);
  const clearLogs = useExecutionStore((s) => s.clearLogs);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  if (logs.length === 0) {
    return <div className="p-3 text-xs text-gray-400 font-mono">No logs. Container stdout/stderr will stream here during execution.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-50">
        <span className="text-[10px] text-gray-400">{logs.length} entries</span>
        <button onClick={clearLogs} className="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Clear logs">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 px-2 py-0.5 hover:bg-gray-50">
            <span className="text-gray-400 w-16 shrink-0 tabular-nums">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className={cn('w-10 shrink-0 uppercase text-[10px] font-semibold', levelColors[log.level] ?? 'text-gray-500')}>
              {log.level}
            </span>
            <span className="text-gray-500 w-16 shrink-0 truncate">{log.source}</span>
            <span className={cn('flex-1 whitespace-pre-wrap break-all', levelColors[log.level] ?? 'text-gray-700')}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/* ─── Problems ─── */

function ProblemsPanel() {
  const problems = useExecutionStore((s) => s.problems);
  const clearProblems = useExecutionStore((s) => s.clearProblems);

  if (problems.length === 0) {
    return <div className="p-3 text-xs text-gray-400">No problems detected.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-50">
        <span className="text-[10px] text-gray-400">{problems.length} problems</span>
        <button onClick={clearProblems} className="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Clear problems">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="p-2 space-y-1 text-xs">
        {problems.map((p) => (
          <div key={p.id} className={cn(
            'flex items-start gap-2 px-2 py-1.5 rounded',
            p.severity === 'error' ? 'bg-red-50 text-red-700' :
            p.severity === 'warning' ? 'bg-amber-50 text-amber-700' :
            'bg-blue-50 text-blue-700'
          )}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-medium">[{p.source}]</span> {p.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Artifacts ─── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const typeIcons: Record<string, string> = {
  'application/json': 'text-blue-500',
  'text/plain': 'text-gray-600',
  'image/png': 'text-green-500',
  'application/pdf': 'text-red-500',
};

function ArtifactsPanel() {
  const artifacts = useExecutionStore((s) => s.artifacts);

  if (artifacts.length === 0) {
    return <div className="p-3 text-xs text-gray-400">No artifacts. Execution outputs (files, logs, reports) will appear here.</div>;
  }

  return (
    <div className="p-2 space-y-1">
      {artifacts.map((a) => (
        <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 border border-gray-100">
          <Package size={14} className={typeIcons[a.type] ?? 'text-gray-400'} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">{a.name}</div>
            <div className="text-[10px] text-gray-400">
              {a.type} · {formatBytes(a.size)} · Run {a.runId.slice(0, 8)}
            </div>
          </div>
          {a.url && (
            <a
              href={a.url}
              download={a.name}
              className="p-1 text-gray-400 hover:text-blue-500"
              aria-label={`Download ${a.name}`}
            >
              <Download size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Cost ─── */

function CostPanel() {
  const cost = useExecutionStore((s) => s.cost);
  const totalCost = useExecutionStore((s) => s.totalCost);

  if (!cost && totalCost === 0) {
    return <div className="p-3 text-xs text-gray-400">No cost data. Budget tracking will appear here during execution.</div>;
  }

  const budgetLimit = cost?.budgetLimit ?? 1.0;
  const currentCost = cost?.cost ?? totalCost;
  const pct = Math.min((currentCost / budgetLimit) * 100, 100);
  const isOver = pct >= 90;
  const isWarning = pct >= 70;

  return (
    <div className="p-4 space-y-4">
      {/* Budget gauge */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-700">Budget Usage</span>
          <span className={cn(
            'text-xs font-mono font-semibold',
            isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-green-600'
          )}>
            ${currentCost.toFixed(4)} / ${budgetLimit.toFixed(2)}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOver ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-green-500'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{pct.toFixed(1)}% of budget consumed</div>
      </div>

      {/* Breakdown */}
      {cost?.breakdown && cost.breakdown.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-700 mb-2">Cost Breakdown by Tool</div>
          <div className="space-y-1.5">
            {cost.breakdown
              .sort((a, b) => b.cost - a.cost)
              .map((item) => {
                const toolPct = budgetLimit > 0 ? (item.cost / budgetLimit) * 100 : 0;
                return (
                  <div key={item.tool} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-32 truncate font-mono">{item.tool}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400 rounded-full" style={{ width: `${toolPct}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 w-16 text-right font-mono">${item.cost.toFixed(4)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Session total */}
      {totalCost > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Session Total</span>
            <span className="text-sm font-mono font-semibold text-gray-800">${totalCost.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Network Inspector ─── */

const methodColors: Record<string, string> = {
  GET: 'text-green-600',
  POST: 'text-blue-600',
  PUT: 'text-amber-600',
  PATCH: 'text-purple-600',
  DELETE: 'text-red-600',
};

function statusColor(status?: number): string {
  if (!status) return 'text-gray-400';
  if (status < 300) return 'text-green-600';
  if (status < 400) return 'text-amber-600';
  return 'text-red-600';
}

function NetworkPanel() {
  const requests = useExecutionStore((s) => s.networkRequests);
  const clearRequests = useExecutionStore((s) => s.clearNetworkRequests);
  const setInspectorItem = useExecutionStore((s) => s.setInspectorItem);

  if (requests.length === 0) {
    return <div className="p-3 text-xs text-gray-400 font-mono">No network activity. API requests will be logged here automatically.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-50">
        <span className="text-[10px] text-gray-400">{requests.length} requests</span>
        <button onClick={clearRequests} className="p-0.5 text-gray-400 hover:text-gray-600" aria-label="Clear requests">
          <Trash2 size={11} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 sticky top-0 bg-white">
          <span className="w-10">Method</span>
          <span className="w-12">Status</span>
          <span className="flex-1">URL</span>
          <span className="w-14 text-right">Time</span>
          <span className="w-14 text-right">Size</span>
        </div>
        {requests.map((req) => (
          <button
            key={req.id}
            onClick={() => setInspectorItem({
              type: 'tool',
              id: req.id,
              name: `${req.method} ${req.url.replace(/^\/v0/, '')}`,
              data: req as unknown as Record<string, unknown>,
            })}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 w-full text-left hover:bg-gray-50 font-mono text-xs',
              req.error ? 'bg-red-50/50' : ''
            )}
          >
            <span className={cn('w-10 font-semibold text-[10px]', methodColors[req.method] ?? 'text-gray-600')}>
              {req.method}
            </span>
            <span className={cn('w-12 tabular-nums', statusColor(req.status))}>
              {req.status ?? '···'}
            </span>
            <span className="flex-1 text-gray-600 truncate">
              {req.url.replace(/^\/v0/, '')}
            </span>
            <span className="w-14 text-right text-gray-400 tabular-nums">
              {req.duration != null ? `${req.duration}ms` : '—'}
            </span>
            <span className="w-14 text-right text-gray-400 tabular-nums">
              {req.responseSize != null ? formatBytes(req.responseSize) : '—'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
