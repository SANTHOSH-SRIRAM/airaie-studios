import { Wifi, Brain, Activity, Zap, Loader2 } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useIDEStore } from '@store/ideStore';
import { useExecutionStore } from '@store/executionStore';

export default function StatusBar() {
  const agentId = useUIStore((s) => s.agentId);
  const setActiveView = useIDEStore((s) => s.setActiveView);
  const events = useExecutionStore((s) => s.events);

  const runningCount = new Set(
    events.filter((e) => e.type.includes('STARTED')).map((e) => e.nodeId)
  ).size - new Set(
    events.filter((e) => e.type.includes('COMPLETED') || e.type.includes('FAILED')).map((e) => e.nodeId)
  ).size;

  return (
    <div className="flex items-center h-6 px-2 bg-blue-700 text-white text-xs shrink-0 select-none">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => setActiveView('builder')}
          className="flex items-center gap-1 hover:bg-blue-600 px-1.5 py-0.5 rounded truncate"
        >
          <Zap size={12} />
          <span className="truncate">{agentId || 'No agent selected'}</span>
        </button>

        <button
          onClick={() => setActiveView('runs')}
          className="flex items-center gap-1 hover:bg-blue-600 px-1.5 py-0.5 rounded"
        >
          {runningCount > 0 ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
          <span>{runningCount > 0 ? `${runningCount} running` : 'Runs'}</span>
        </button>

        <button
          onClick={() => setActiveView('memory')}
          className="flex items-center gap-1 hover:bg-blue-600 px-1.5 py-0.5 rounded"
        >
          <Brain size={12} />
          <span>Memory</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-blue-200">
          <Wifi size={12} />
          Connected
        </span>
      </div>
    </div>
  );
}
