import React, { useState, useCallback } from 'react';
import { cn, Button, Badge } from '@airaie/ui';
import { Pause, Play, SkipForward } from 'lucide-react';
import type { RunEvent } from '@airaie/shared';
import { useRunStream } from '@hooks/useAgentRun';

export interface StepDebuggerProps {
  runId: string | null;
  className?: string;
}

const StepDebugger: React.FC<StepDebuggerProps> = ({ runId, className }) => {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);

  const handleEvent = useCallback(
    (event: RunEvent) => {
      if (!paused) {
        setEvents((prev) => [...prev, event]);
        setCurrentIdx((prev) => prev + 1);
      } else {
        setEvents((prev) => [...prev, event]);
      }
    },
    [paused]
  );

  useRunStream(runId, handleEvent);

  const stepForward = () => {
    if (currentIdx < events.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  if (!runId) {
    return (
      <div className={cn('flex items-center justify-center h-full text-sm text-content-muted', className)}>
        Start a run to use the step debugger.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-border bg-white">
        <Button
          variant={paused ? 'primary' : 'outline'}
          size="sm"
          icon={paused ? Play : Pause}
          onClick={() => setPaused(!paused)}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="ghost" size="sm" icon={SkipForward} onClick={stepForward} disabled={!paused}>
          Step
        </Button>
        <span className="ml-auto text-xs text-content-muted">
          {currentIdx + 1} / {events.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
        {events.length === 0 ? (
          <span className="text-content-muted">Waiting for events...</span>
        ) : (
          events.map((ev, i) => (
            <div
              key={ev.event_id}
              className={cn(
                'flex items-start gap-2 px-2 py-1 transition-colors',
                i === currentIdx && 'bg-blue-50 border-l-2 border-l-brand-secondary',
                i > currentIdx && paused && 'opacity-30'
              )}
            >
              <span className="text-content-muted w-16 flex-shrink-0 tabular-nums">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
              <Badge
                variant={
                  ev.event_type.includes('FAILED') ? 'danger' :
                  ev.event_type.includes('COMPLETED') || ev.event_type.includes('SUCCEEDED') ? 'success' :
                  ev.event_type.includes('STARTED') || ev.event_type.includes('RUNNING') ? 'info' :
                  'neutral'
                }
                badgeStyle="outline"
              >
                {ev.event_type}
              </Badge>
              {ev.node_id && <span className="text-blue-500">{ev.node_id}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

StepDebugger.displayName = 'StepDebugger';

export default StepDebugger;
