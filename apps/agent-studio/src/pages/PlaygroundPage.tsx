import React, { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { usePlaygroundStore } from '@store/playgroundStore';
import AgentChat from '@components/playground/AgentChat';
import ProposalInspector from '@components/playground/ProposalInspector';
import StepDebugger from '@components/playground/StepDebugger';
import SessionManager from '@components/playground/SessionManager';
import DryRunToggle from '@components/playground/DryRunToggle';
import AgentGraph from '@components/graph/AgentGraph';
import { GitFork, MessageSquare, Bug } from 'lucide-react';
import { cn } from '@airaie/ui';

interface PlaygroundPageProps {
  initialSessionId?: string;
}

type RightPanel = 'graph' | 'inspector' | 'debugger';

export default function PlaygroundPage({ initialSessionId }: PlaygroundPageProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('graph');
  const activeRunId = usePlaygroundStore((s) => s.activeRunId);
  const setActiveSession = usePlaygroundStore((s) => s.setActiveSession);

  useEffect(() => {
    if (initialSessionId) setActiveSession(initialSessionId);
  }, [initialSessionId, setActiveSession]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <SessionManager />
        <div className="flex-1" />
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
          {([
            { id: 'graph' as const, icon: GitFork, label: 'Graph' },
            { id: 'inspector' as const, icon: MessageSquare, label: 'Inspector' },
            { id: 'debugger' as const, icon: Bug, label: 'Debugger' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRightPanel(tab.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
                rightPanel === tab.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>
        <DryRunToggle />
      </div>

      {/* Resizable split panels */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <Group orientation="horizontal" id="playground-panels" className="h-full w-full">
          {/* Chat panel */}
          <Panel id="pg-chat" defaultSize="45%" minSize="25%">
            <AgentChat
              selectedProposalId={selectedProposalId}
              onSelectProposal={setSelectedProposalId}
            />
          </Panel>

          <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

          {/* Right panel: Graph / Inspector / Debugger */}
          <Panel id="pg-right" defaultSize="55%" minSize="30%">
            {rightPanel === 'graph' && (
              <AgentGraph className="h-full" />
            )}
            {rightPanel === 'inspector' && (
              <ProposalInspector selectedProposalId={selectedProposalId} />
            )}
            {rightPanel === 'debugger' && (
              <StepDebugger runId={activeRunId} />
            )}
          </Panel>
        </Group>
      </div>
    </div>
  );
}
