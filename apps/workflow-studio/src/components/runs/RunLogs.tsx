import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@airaie/ui';
import { ArrowDownToLine } from 'lucide-react';
import type { RunEvent } from '@airaie/shared';
import { useRunLogs, useRunStream } from '@hooks/useRuns';

interface LogEntry {
  id: string;
  timestamp: string;
  nodeId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const MAX_LOG_ENTRIES = 10_000;
const LOG_ROW_HEIGHT = 24;

const levelColors = {
  info: 'text-content-secondary',
  warn: 'text-amber-600',
  error: 'text-status-danger',
};

export interface RunLogsProps {
  runId: string;
  isActive: boolean;
  className?: string;
}

let logCounter = 0;

const RunLogs: React.FC<RunLogsProps> = React.memo(({ runId, isActive, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const historicalLoaded = useRef(false);

  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => LOG_ROW_HEIGHT,
    overscan: 30,
  });

  // Fetch historical logs on mount
  const { data: historicalLogs } = useRunLogs(runId);

  useEffect(() => {
    if (historicalLogs && !historicalLoaded.current) {
      historicalLoaded.current = true;
      const entries: LogEntry[] = (historicalLogs as any[]).map((log) => ({
        id: `hist_${++logCounter}`,
        timestamp: log.timestamp ?? log.created_at ?? '',
        nodeId: log.node_id ?? '',
        level: (log.level as LogEntry['level']) ?? 'info',
        message: log.message ?? '',
      }));
      setLogs(entries);
    }
  }, [historicalLogs]);

  // Stream live logs via SSE
  const handleEvent = useCallback((event: RunEvent) => {
    if (event.event_type === 'NODE_LOG') {
      const entry: LogEntry = {
        id: `sse_${++logCounter}`,
        timestamp: event.timestamp,
        nodeId: event.node_id ?? '',
        level: (event.payload.level as LogEntry['level']) ?? 'info',
        message: (event.payload.message as string) ?? '',
      };
      setLogs((prev) => {
        const next = [...prev, entry];
        return next.length > MAX_LOG_ENTRIES ? next.slice(-MAX_LOG_ENTRIES) : next;
      });
    }
  }, []);

  useRunStream(isActive ? runId : null, handleEvent);

  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      virtualizer.scrollToIndex(logs.length - 1, { align: 'end' });
    }
  }, [logs.length, autoScroll, virtualizer]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Auto-scroll toggle */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-surface-border">
        <span className="text-[10px] text-content-muted tabular-nums">{logs.length.toLocaleString()} entries</span>
        <label className="flex items-center gap-1.5 text-xs text-content-muted cursor-pointer">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-3 h-3 accent-brand-secondary"
            aria-label="Auto-scroll logs"
          />
          <ArrowDownToLine size={12} />
          Auto-scroll
        </label>
      </div>

      {/* Virtualized log entries */}
      <div
        ref={containerRef}
        role="log"
        aria-label="Run logs"
        className="flex-1 overflow-y-auto p-3 bg-[#f8fafc] font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <span className="text-content-muted">Waiting for log output...</span>
        ) : (
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = logs[virtualRow.index];
              return (
                <div
                  key={entry.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex gap-2"
                >
                  <span className="text-content-muted flex-shrink-0 w-20 tabular-nums">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-blue-500 flex-shrink-0 w-24 truncate">{entry.nodeId}</span>
                  <span className={levelColors[entry.level]}>{entry.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

RunLogs.displayName = 'RunLogs';

export default RunLogs;
