import React, { Suspense } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { ErrorBoundary } from '@airaie/ui';
import { useIDEStore } from '@store/ideStore';
import ActivityBar from './ActivityBar';
import StatusBar from './StatusBar';
import BottomPanel from './BottomPanel';
import ContextInspector from './ContextInspector';
import CommandPalette from './CommandPalette';
import KeyboardShortcuts from './KeyboardShortcuts';

const DashboardPage = React.lazy(() => import('@pages/DashboardPage'));
const BuilderPage = React.lazy(() => import('@pages/BuilderPage'));
const PlaygroundPage = React.lazy(() => import('@pages/PlaygroundPage'));
const RunsPage = React.lazy(() => import('@pages/RunsPage'));
const ApprovalsPage = React.lazy(() => import('@pages/ApprovalsPage'));
const EvalsPage = React.lazy(() => import('@pages/EvalsPage'));
const VersionsPage = React.lazy(() => import('@pages/VersionsPage'));
const PolicyPage = React.lazy(() => import('@pages/PolicyPage'));
const MemoryPage = React.lazy(() => import('@pages/MemoryPage'));
const AnalyticsPage = React.lazy(() => import('@pages/AnalyticsPage'));
const AgentGraph = React.lazy(() => import('@components/graph/AgentGraph'));

const PageFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="animate-pulse text-sm text-gray-400">Loading...</div>
  </div>
);

function EditorArea() {
  const activeView = useIDEStore((s) => s.activeView);

  return (
    <Suspense fallback={<PageFallback />}>
      <ErrorBoundary label={activeView}>
        {activeView === 'dashboard' && <DashboardPage />}
        {activeView === 'builder' && <BuilderPage />}
        {activeView === 'graph' && <AgentGraph className="h-full" />}
        {activeView === 'playground' && <PlaygroundPage />}
        {activeView === 'runs' && <RunsPage />}
        {activeView === 'approvals' && <ApprovalsPage />}
        {activeView === 'evals' && <EvalsPage />}
        {activeView === 'versions' && <VersionsPage />}
        {activeView === 'policy' && <PolicyPage />}
        {activeView === 'memory' && <MemoryPage />}
        {activeView === 'analytics' && <AnalyticsPage />}
      </ErrorBoundary>
    </Suspense>
  );
}

export default function AgentIDEShell() {
  const bottomCollapsed = useIDEStore((s) => s.bottomCollapsed);
  const inspectorCollapsed = useIDEStore((s) => s.inspectorCollapsed);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      <KeyboardShortcuts />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ActivityBar />

        <div className="flex flex-1 min-w-0 h-full overflow-hidden">
          <Group orientation="horizontal" className="flex-1 h-full min-w-0" id="ide-main">
            <Panel id="editor-and-bottom" minSize="40%">
              <Group orientation="vertical" id="ide-vertical" className="h-full">
                <Panel id="editor" minSize="30%">
                  <div className="h-full w-full overflow-hidden">
                    <EditorArea />
                  </div>
                </Panel>

              {!bottomCollapsed && (
                <>
                  <Separator className="h-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />
                  <Panel id="bottom" defaultSize="30%" minSize="15%" maxSize="50%">
                    <BottomPanel />
                  </Panel>
                </>
              )}
              </Group>
            </Panel>

            {!inspectorCollapsed && (
              <>
                <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />
                <Panel id="inspector" defaultSize="22%" minSize="15%" maxSize="35%">
                  <ContextInspector />
                </Panel>
              </>
            )}
          </Group>

          {inspectorCollapsed && <ContextInspector />}
        </div>
      </div>

      {bottomCollapsed && (
        <div className="shrink-0 border-t border-gray-200">
          <BottomPanel />
        </div>
      )}

      <StatusBar />
      <CommandPalette />
    </div>
  );
}
