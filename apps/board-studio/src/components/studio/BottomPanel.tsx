// ============================================================
// BottomPanel — resizable contextual panel (Execution, Logs, Evidence, Preflight, Tools)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  FileText,
  ShieldCheck,
  Wrench,
  ChevronUp,
  X,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Badge, Spinner } from '@airaie/ui';
import { usePlanExecutionStatus } from '@hooks/usePlan';

export interface BottomPanelProps {
  visible: boolean;
  onToggle: () => void;
  selectedCardId: string | undefined;
  boardId: string;
  /** Whether a card is currently executing (enables the Execution tab) */
  isExecuting?: boolean;
  evidenceView?: React.ReactNode;
  triageView?: React.ReactNode;
  toolShelf?: React.ReactNode;
  preflightResults?: React.ReactNode;
  gateList?: React.ReactNode;
  recordsPanel?: React.ReactNode;
}

type BottomTab = 'execution' | 'logs' | 'evidence' | 'preflight' | 'tools' | 'gates' | 'records';

const tabs: { id: BottomTab; label: string; icon: React.FC<{ size?: number; className?: string }>; requiresCard?: boolean }[] = [
  { id: 'execution', label: 'Execution', icon: Activity, requiresCard: true },
  { id: 'logs', label: 'Logs', icon: Terminal, requiresCard: true },
  { id: 'gates', label: 'Gates', icon: ShieldCheck },
  { id: 'evidence', label: 'Evidence', icon: FileText },
  { id: 'records', label: 'Records', icon: FileText },
  { id: 'preflight', label: 'Preflight', icon: ShieldCheck, requiresCard: true },
  { id: 'tools', label: 'Tools', icon: Wrench, requiresCard: true },
];

const BottomPanel: React.FC<BottomPanelProps> = ({
  visible,
  onToggle,
  selectedCardId,
  isExecuting = false,
  evidenceView,
  toolShelf,
  preflightResults,
  gateList,
  recordsPanel,
}) => {
  const [activeTab, setActiveTab] = useState<BottomTab>('execution');
  const prevCardId = useRef(selectedCardId);

  // Auto-switch to execution tab when execution starts
  useEffect(() => {
    if (isExecuting) {
      setActiveTab('execution');
    }
  }, [isExecuting]);

  // When card changes, reset to execution tab
  useEffect(() => {
    if (selectedCardId !== prevCardId.current) {
      prevCardId.current = selectedCardId;
      if (selectedCardId) {
        setActiveTab('execution');
      }
    }
  }, [selectedCardId]);

  if (!visible) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1 border-t border-surface-border
          bg-surface-bg text-xs text-content-tertiary hover:text-content-primary
          transition-colors w-full"
      >
        <ChevronUp size={12} />
        <Terminal size={12} />
        <span>Panel</span>
        {isExecuting && (
          <span className="ml-auto flex items-center gap-1 text-blue-600">
            <Loader2 size={10} className="animate-spin" />
            <span className="text-[10px]">Executing</span>
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="border-t border-surface-border bg-white flex flex-col" style={{ height: 260 }}>
      {/* Tab bar */}
      <div className="flex items-center justify-between px-2 border-b border-surface-border bg-surface-bg flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {tabs.map(({ id, label, icon: Icon, requiresCard }) => {
            const disabled = requiresCard && !selectedCardId;
            return (
              <button
                key={id}
                onClick={() => !disabled && setActiveTab(id)}
                disabled={disabled}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors
                  ${disabled ? 'text-content-muted opacity-40 cursor-not-allowed' : ''}
                  ${activeTab === id && !disabled
                    ? 'text-content-primary border-b-2 border-blue-500 font-medium'
                    : !disabled ? 'text-content-tertiary hover:text-content-secondary' : ''
                  }
                `}
              >
                <Icon size={12} />
                {label}
                {id === 'execution' && isExecuting && (
                  <Loader2 size={10} className="animate-spin text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-content-muted hover:text-content-primary transition-colors"
          title="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'execution' && (
          <ExecutionTab selectedCardId={selectedCardId} isExecuting={isExecuting} />
        )}
        {activeTab === 'logs' && (
          <LogsTab selectedCardId={selectedCardId} />
        )}
        {activeTab === 'gates' && (
          <div className="p-3 overflow-auto">
            {gateList ?? (
              <EmptyTabMessage message="No gates loaded." />
            )}
          </div>
        )}
        {activeTab === 'evidence' && (
          <div className="p-3">
            {evidenceView ?? (
              <EmptyTabMessage message="Select a card to view evidence." />
            )}
          </div>
        )}
        {activeTab === 'preflight' && (
          <div className="p-3">
            {preflightResults ?? (
              <EmptyTabMessage message="Select a card to view preflight checks." />
            )}
          </div>
        )}
        {activeTab === 'records' && (
          <div className="p-3 overflow-auto">
            {recordsPanel ?? (
              <EmptyTabMessage message="No records loaded." />
            )}
          </div>
        )}
        {activeTab === 'tools' && (
          <div className="p-3">
            {toolShelf ?? (
              <EmptyTabMessage message="Select a card to view available tools." />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Execution tab — shows real-time plan execution status ---

function ExecutionTab({ selectedCardId, isExecuting }: { selectedCardId: string | undefined; isExecuting: boolean }) {
  const { data: execStatus, isLoading } = usePlanExecutionStatus(selectedCardId, isExecuting);

  if (!selectedCardId) {
    return <EmptyTabMessage message="Select a card to view execution status." />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!execStatus || !execStatus.steps?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity size={20} className="text-content-muted mb-2" />
        <p className="text-xs text-content-muted">No execution data yet.</p>
        <p className="text-[10px] text-content-muted mt-1">Run the card to see execution progress here.</p>
      </div>
    );
  }

  const pct = execStatus.total_steps
    ? Math.round((execStatus.completed_steps / execStatus.total_steps) * 100)
    : 0;

  return (
    <div className="p-3 space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-content-tertiary">
            {execStatus.status === 'completed' ? 'Completed' :
             execStatus.status === 'failed' ? 'Failed' :
             execStatus.status === 'executing' ? 'Executing...' :
             execStatus.status}
          </span>
          <span className="font-medium text-content-primary studio-mono">
            {execStatus.completed_steps}/{execStatus.total_steps} steps · {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-surface-bg border border-surface-border">
          <div
            className={`h-full transition-all duration-500 ${
              execStatus.status === 'failed' ? 'bg-red-500' :
              execStatus.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-1">
        {execStatus.steps.map((step, i) => (
          <div
            key={step.id}
            className="flex items-center gap-2 px-2 py-1.5 text-xs"
          >
            <span className="text-[10px] text-content-muted studio-mono w-4 text-right flex-shrink-0">
              {i + 1}
            </span>
            {step.status === 'completed' ? (
              <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" />
            ) : step.status === 'running' ? (
              <Loader2 size={13} className="text-blue-500 animate-spin flex-shrink-0" />
            ) : step.status === 'failed' ? (
              <XCircle size={13} className="text-red-500 flex-shrink-0" />
            ) : (
              <div className="w-[13px] h-[13px] rounded-full border-2 border-surface-border flex-shrink-0" />
            )}
            <span className="flex-1 truncate text-content-primary">{step.tool_name}</span>
            <Badge
              variant={
                step.status === 'completed' ? 'success' :
                step.status === 'running' ? 'info' :
                step.status === 'failed' ? 'danger' : 'neutral'
              }
              className="text-[9px] flex-shrink-0"
            >
              {step.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Logs tab (terminal-style) ---

function LogsTab({ selectedCardId }: { selectedCardId: string | undefined }) {
  if (!selectedCardId) {
    return <EmptyTabMessage message="Select a card to view run logs." />;
  }

  return (
    <div className="p-3 bg-slate-950 h-full overflow-auto">
      <div className="space-y-0.5">
        <LogLine level="info" time="00:00.000" message={`Initializing card ${selectedCardId.slice(0, 8)}...`} />
        <LogLine level="info" time="00:00.012" message="Loading configuration..." />
        <LogLine level="info" time="00:00.045" message="Resolving dependencies..." />
        <LogLine level="info" time="00:00.089" message="Ready. Awaiting execution." />
        <div className="pt-2 text-xs text-slate-600 studio-mono">
          Live logs will stream here during card execution.
        </div>
      </div>
    </div>
  );
}

function LogLine({ level, time, message }: { level: 'info' | 'warn' | 'error'; time: string; message: string }) {
  const color = level === 'error' ? 'text-red-400' : level === 'warn' ? 'text-amber-400' : 'text-slate-400';
  return (
    <div className="studio-log-line flex items-start gap-2">
      <span className="text-slate-600 flex-shrink-0">{time}</span>
      <span className={`${color} flex-shrink-0 uppercase text-[10px]`}>{level}</span>
      <span className="text-slate-300">{message}</span>
    </div>
  );
}

function EmptyTabMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full py-8 text-xs text-content-muted">
      {message}
    </div>
  );
}

BottomPanel.displayName = 'BottomPanel';

export default BottomPanel;
