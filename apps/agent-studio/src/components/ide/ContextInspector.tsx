import { PanelRightClose, PanelRightOpen, FileJson, List, Clock, Code, Cpu, Brain, BarChart2, Activity } from 'lucide-react';
import { useIDEStore } from '@store/ideStore';
import { useExecutionStore, type InspectorItem } from '@store/executionStore';
import { cn, Badge, JsonViewer } from '@airaie/ui';
import { useState, useMemo } from 'react';

type InspectorTab = 'properties' | 'schema' | 'history' | 'json';

const inspectorTabs: { id: InspectorTab; label: string; icon: typeof FileJson }[] = [
  { id: 'properties', label: 'Properties', icon: List },
  { id: 'schema', label: 'Schema', icon: Code },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'json', label: 'JSON', icon: FileJson },
];

const typeIcons: Record<string, typeof Cpu> = {
  tool: Cpu,
  node: Activity,
  run: BarChart2,
  memory: Brain,
};

export default function ContextInspector() {
  const inspectorCollapsed = useIDEStore((s) => s.inspectorCollapsed);
  const toggleInspector = useIDEStore((s) => s.toggleInspector);
  const inspectorItem = useExecutionStore((s) => s.inspectorItem);
  const [activeTab, setActiveTab] = useState<InspectorTab>('properties');

  if (inspectorCollapsed) {
    return (
      <div className="flex flex-col items-center w-10 h-full border-l border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={toggleInspector}
          className="p-2 mt-2 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Open inspector"
        >
          <PanelRightOpen size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-l border-gray-200 bg-white h-full">
      {/* Header */}
      <div className="flex items-center h-9 px-3 border-b border-gray-100 shrink-0">
        {inspectorItem ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="info" badgeStyle="outline" className="text-[10px] shrink-0">
              {inspectorItem.type}
            </Badge>
            <span className="text-xs font-medium text-gray-700 truncate">{inspectorItem.name}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-gray-500 flex-1">Inspector</span>
        )}
        <button
          onClick={toggleInspector}
          className="p-1 text-gray-400 hover:text-gray-600 rounded ml-2"
          aria-label="Close inspector"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-2 pt-1 border-b border-gray-100 shrink-0">
        {inspectorTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 text-xs rounded-t transition-colors',
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-blue-500 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {!inspectorItem ? (
          <p className="text-xs text-gray-400">Select an item to inspect its properties.</p>
        ) : (
          <InspectorContent item={inspectorItem} tab={activeTab} />
        )}
      </div>
    </div>
  );
}

/* ─── Properties ─── */

function ToolProperties({ data }: { data: Record<string, unknown> }) {
  const method = data.method as string | undefined;
  const url = data.url as string | undefined;
  const status = data.status as number | undefined;
  const duration = data.duration as number | undefined;
  const error = data.error as string | undefined;

  return (
    <div className="space-y-3">
      {method ? (
        <PropertyRow label="Method" value={
          <span className={cn(
            'font-mono font-semibold text-[11px]',
            method === 'GET' ? 'text-green-600' :
            method === 'POST' ? 'text-blue-600' :
            method === 'DELETE' ? 'text-red-600' : 'text-gray-600'
          )}>
            {method}
          </span>
        } />
      ) : null}
      {url ? <PropertyRow label="URL" value={<span className="font-mono text-blue-600 break-all">{url}</span>} /> : null}
      {status != null ? (
        <PropertyRow label="Status" value={
          <Badge
            variant={status < 300 ? 'success' : status < 400 ? 'neutral' : 'danger'}
            badgeStyle="outline"
            className="text-[10px]"
          >
            {String(status)}
          </Badge>
        } />
      ) : null}
      {duration != null ? <PropertyRow label="Duration" value={`${duration}ms`} /> : null}
      {error ? <PropertyRow label="Error" value={<span className="text-red-600">{error}</span>} /> : null}
      {renderRemainingProperties(data, ['method', 'url', 'status', 'duration', 'error', 'id', 'timestamp', 'requestSize', 'responseSize'])}
    </div>
  );
}

function NodeProperties({ data }: { data: Record<string, unknown> }) {
  const label = data.label as string | undefined;
  const status = data.status as string | undefined;
  const detail = data.detail as string | undefined;

  return (
    <div className="space-y-3">
      {label ? <PropertyRow label="Node" value={<span className="font-semibold">{label}</span>} /> : null}
      {status ? (
        <PropertyRow label="Status" value={
          <Badge
            variant={status === 'completed' ? 'success' : status === 'failed' ? 'danger' : status === 'running' ? 'info' : 'neutral'}
            badgeStyle="outline"
            className="text-[10px]"
          >
            {status}
          </Badge>
        } />
      ) : null}
      {detail ? <PropertyRow label="Detail" value={detail} /> : null}
      {renderRemainingProperties(data, ['label', 'status', 'detail'])}
    </div>
  );
}

function RunProperties({ data }: { data: Record<string, unknown> }) {
  const id = data.id as string | undefined;
  const status = data.status as string | undefined;
  const agentId = data.agent_id as string | undefined;
  const durationMs = data.duration_ms as number | undefined;
  const cost = data.cost as number | undefined;

  return (
    <div className="space-y-3">
      {id ? <PropertyRow label="Run ID" value={<span className="font-mono">{id}</span>} /> : null}
      {status ? (
        <PropertyRow label="Status" value={
          <Badge
            variant={status === 'SUCCEEDED' ? 'success' : status === 'FAILED' ? 'danger' : status === 'RUNNING' ? 'info' : 'neutral'}
            badgeStyle="outline"
            className="text-[10px]"
          >
            {status}
          </Badge>
        } />
      ) : null}
      {agentId ? <PropertyRow label="Agent" value={agentId} /> : null}
      {durationMs != null ? <PropertyRow label="Duration" value={`${durationMs.toLocaleString()}ms`} /> : null}
      {cost != null ? <PropertyRow label="Cost" value={`$${cost.toFixed(4)}`} /> : null}
      {renderRemainingProperties(data, ['id', 'status', 'agent_id', 'duration_ms', 'cost'])}
    </div>
  );
}

function MemoryProperties({ data }: { data: Record<string, unknown> }) {
  const typeColor: Record<string, string> = {
    fact: 'bg-blue-100 text-blue-700',
    preference: 'bg-green-100 text-green-700',
    lesson: 'bg-amber-100 text-amber-700',
    error_pattern: 'bg-red-100 text-red-700',
  };
  const memoryType = data.memory_type as string | undefined;
  const content = data.content as string | undefined;
  const relevanceScore = data.relevance_score as number | undefined;
  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : undefined;
  const sourceRunId = data.source_run_id as string | undefined;

  return (
    <div className="space-y-3">
      {memoryType ? (
        <PropertyRow label="Type" value={
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeColor[memoryType] ?? 'bg-gray-100 text-gray-700')}>
            {memoryType}
          </span>
        } />
      ) : null}
      {content ? <PropertyRow label="Content" value={content} /> : null}
      {relevanceScore != null ? (
        <PropertyRow label="Relevance" value={`${(relevanceScore * 100).toFixed(0)}%`} />
      ) : null}
      {tags ? (
        <PropertyRow label="Tags" value={
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="neutral" badgeStyle="outline" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
        } />
      ) : null}
      {sourceRunId ? <PropertyRow label="Source Run" value={<span className="font-mono">{sourceRunId}</span>} /> : null}
      {renderRemainingProperties(data, ['memory_type', 'content', 'relevance_score', 'tags', 'source_run_id'])}
    </div>
  );
}

function PropertyRow({ label, value }: { label: string; value: React.ReactNode | unknown }) {
  const rendered = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : value;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{label}</dt>
      <dd className="text-xs text-gray-700 mt-0.5 break-all">{rendered as React.ReactNode}</dd>
    </div>
  );
}

function renderRemainingProperties(data: Record<string, unknown>, exclude: string[]) {
  const excludeSet = new Set(exclude);
  const remaining = Object.entries(data).filter(([key]) => !excludeSet.has(key));
  if (remaining.length === 0) return null;
  return (
    <>
      {remaining.map(([key, value]) => (
        <PropertyRow
          key={key}
          label={key.replace(/_/g, ' ')}
          value={
            typeof value === 'object'
              ? <pre className="text-[10px] font-mono whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
              : String(value ?? '—')
          }
        />
      ))}
    </>
  );
}

/* ─── History ─── */

function HistoryContent({ item }: { item: InspectorItem }) {
  const events = useExecutionStore((s) => s.events);

  const relatedEvents = useMemo(() => {
    return events.filter(
      (ev) =>
        ev.nodeId === item.id ||
        ev.payload?.toolId === item.id ||
        ev.payload?.runId === item.id
    );
  }, [events, item.id]);

  if (relatedEvents.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        <p>No execution history for this item.</p>
        <p className="mt-2 text-[10px]">History is populated from execution events. Run the agent to see event history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-[10px] text-gray-400 mb-2">{relatedEvents.length} events</div>
      {relatedEvents.map((ev) => (
        <div key={ev.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 text-xs">
          <span className="text-gray-400 w-16 shrink-0 tabular-nums font-mono">
            {new Date(ev.timestamp).toLocaleTimeString()}
          </span>
          <Badge
            variant={
              ev.type.includes('FAILED') ? 'danger' :
              ev.type.includes('COMPLETED') ? 'success' :
              ev.type.includes('STARTED') ? 'info' : 'neutral'
            }
            badgeStyle="outline"
            className="text-[10px]"
          >
            {ev.type}
          </Badge>
          {ev.payload && Object.keys(ev.payload).length > 0 && (
            <span className="text-gray-400 text-[10px] truncate flex-1">
              {JSON.stringify(ev.payload).slice(0, 60)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Content Router ─── */

function InspectorContent({ item, tab }: { item: InspectorItem; tab: InspectorTab }) {
  if (tab === 'json') {
    return <JsonViewer data={item.data} />;
  }

  if (tab === 'properties') {
    switch (item.type) {
      case 'tool': return <ToolProperties data={item.data} />;
      case 'node': return <NodeProperties data={item.data} />;
      case 'run': return <RunProperties data={item.data} />;
      case 'memory': return <MemoryProperties data={item.data} />;
      default:
        return (
          <div className="space-y-3">
            {Object.entries(item.data).map(([key, value]) => (
              <PropertyRow
                key={key}
                label={key.replace(/_/g, ' ')}
                value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '—')}
              />
            ))}
          </div>
        );
    }
  }

  if (tab === 'schema') {
    const schema = item.data.schema || item.data.context_schema || item.data.interface;
    if (!schema) return <p className="text-xs text-gray-400">No schema available.</p>;
    return <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">{JSON.stringify(schema, null, 2)}</pre>;
  }

  if (tab === 'history') {
    return <HistoryContent item={item} />;
  }

  return null;
}
