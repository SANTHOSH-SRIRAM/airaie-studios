import React from 'react';
import { cn, Badge, StatusBadge, Card, Spinner, JsonViewer, Tabs, formatDuration, formatCost } from '@airaie/ui';
import { Clock, DollarSign, Layers, FileOutput, Activity } from 'lucide-react';
import { calcElapsedSeconds, toUiNodeRunStatus } from '@airaie/shared';
import type { KernelRun, KernelNodeRun, KernelAuditEvent } from '@airaie/shared';
import { useRunLogs, useRunTrace } from '@hooks/useRuns';
import DecisionTracePanel from './DecisionTracePanel';

export interface RunDetailPanelProps {
  run: KernelRun;
  className?: string;
}

function MetricCard({ icon: Icon, label, value, className }: { icon: React.ElementType; label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 bg-surface-bg border border-surface-border rounded', className)}>
      <Icon size={16} className="text-content-muted shrink-0" />
      <div>
        <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium">{label}</p>
        <p className="text-sm font-semibold text-content-primary font-mono mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function ExecutionTimeline({ logs }: { logs: KernelNodeRun[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-content-muted py-4">No execution nodes recorded.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map((node) => {
        const elapsed = calcElapsedSeconds(node.started_at, node.completed_at);
        return (
          <div key={node.id} className="flex items-center gap-3 px-3 py-2 border border-surface-border rounded bg-white">
            <StatusBadge status={toUiNodeRunStatus(node.status) as any} />
            <span className="text-xs font-mono text-content-primary truncate flex-1">{node.tool_ref}</span>
            <span className="text-[10px] text-content-muted">#{node.attempt}</span>
            {elapsed !== null && (
              <span className="text-xs text-content-secondary tabular-nums">{formatDuration(elapsed)}</span>
            )}
            <span className="text-xs text-content-muted tabular-nums">{formatCost(node.cost_actual)}</span>
          </div>
        );
      })}
    </div>
  );
}

function ArtifactList({ run }: { run: KernelRun }) {
  const inputs = run.inputs ?? {};
  const outputs = run.outputs ?? {};
  const hasData = Object.keys(inputs).length > 0 || Object.keys(outputs).length > 0;

  if (!hasData) {
    return <p className="text-sm text-content-muted py-4">No artifacts for this run.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.keys(inputs).length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-2">Inputs</h4>
          <JsonViewer data={inputs} defaultExpandDepth={2} />
        </div>
      )}
      {Object.keys(outputs).length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider mb-2">Outputs</h4>
          <JsonViewer data={outputs} defaultExpandDepth={2} />
        </div>
      )}
    </div>
  );
}

const tabs = [
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'artifacts', label: 'Artifacts', icon: FileOutput },
  { id: 'trace', label: 'Decision Trace', icon: Layers },
];

const RunDetailPanel: React.FC<RunDetailPanelProps> = ({ run, className }) => {
  const [activeTab, setActiveTab] = React.useState('timeline');
  const [verbosity, setVerbosity] = React.useState<'minimal' | 'normal' | 'verbose'>('normal');
  const { data: logs, isLoading: logsLoading } = useRunLogs(run.id);
  const { data: traceEvents, isLoading: traceLoading } = useRunTrace(run.id, verbosity);

  const elapsed = calcElapsedSeconds(run.started_at, run.completed_at);
  const nodeRuns = Array.isArray(logs) ? logs : [];
  const auditEvents = Array.isArray(traceEvents) ? traceEvents : [];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Clock} label="Duration" value={elapsed !== null ? formatDuration(elapsed) : '—'} />
        <MetricCard icon={DollarSign} label="Cost" value={formatCost(run.cost_actual)} />
        <MetricCard icon={Layers} label="Nodes" value={nodeRuns.length} />
        <MetricCard
          icon={Activity}
          label="Type"
          value={<Badge variant="info" badgeStyle="outline">{run.run_type}</Badge>}
        />
      </div>

      {/* Tab content */}
      <Card>
        <div className="px-4">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <Card.Body>
          {activeTab === 'timeline' && (
            logsLoading
              ? <div className="flex justify-center py-8"><Spinner /></div>
              : <ExecutionTimeline logs={nodeRuns} />
          )}

          {activeTab === 'artifacts' && <ArtifactList run={run} />}

          {activeTab === 'trace' && (
            traceLoading
              ? <div className="flex justify-center py-8"><Spinner /></div>
              : <DecisionTracePanel events={auditEvents} verbosity={verbosity} onVerbosityChange={setVerbosity} />
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

RunDetailPanel.displayName = 'RunDetailPanel';

export default RunDetailPanel;
