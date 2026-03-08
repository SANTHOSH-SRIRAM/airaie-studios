import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppShell, useEmbedded } from '@airaie/shell';
import { ErrorBoundary } from '@airaie/ui';
import type { BoardTab } from '@airaie/shell';
import { LayoutDashboard, PenTool, Play, Package, GitBranch, Zap, Shield } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import DashboardPage from '@pages/DashboardPage';

const BuilderPage = React.lazy(() => import('@pages/BuilderPage'));
const RunsPage = React.lazy(() => import('@pages/RunsPage'));
const ArtifactsPage = React.lazy(() => import('@pages/ArtifactsPage'));
const VersionsPage = React.lazy(() => import('@pages/VersionsPage'));
const TriggersPage = React.lazy(() => import('@pages/TriggersPage'));
const ApprovalsPage = React.lazy(() => import('@pages/ApprovalsPage'));

const PageFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-pulse text-sm text-content-muted">Loading...</div>
  </div>
);

const boardTabs: BoardTab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'builder', label: 'Builder', icon: PenTool, path: '/builder' },
  { id: 'runs', label: 'Runs', icon: Play, path: '/runs' },
  { id: 'artifacts', label: 'Artifacts', icon: Package, path: '/artifacts' },
  { id: 'versions', label: 'Versions', icon: GitBranch, path: '/versions' },
  { id: 'triggers', label: 'Triggers', icon: Zap, path: '/triggers' },
  { id: 'approvals', label: 'Approvals', icon: Shield, path: '/approvals' },
];

/** Route wrapper that hydrates workflowId from URL into the UI store */
function BuilderRoute() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const setWorkflow = useUIStore((s) => s.setWorkflow);
  React.useEffect(() => {
    if (workflowId) setWorkflow(workflowId, '');
  }, [workflowId, setWorkflow]);
  return <BuilderPage />;
}

/** Route wrapper that passes runId from URL to RunsPage */
function RunDetailRoute() {
  const { runId } = useParams<{ runId: string }>();
  return <RunsPage initialRunId={runId} />;
}

export default function App() {
  const embedded = useEmbedded();

  return (
    <ErrorBoundary label="Workflow Studio">
      <AppShell
        studioName="Workflow Studio"
        activeSidebarItem="workflows"
        boardTabs={embedded ? undefined : boardTabs}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/builder" element={<ErrorBoundary label="Builder"><BuilderPage /></ErrorBoundary>} />
            <Route path="/builder/:workflowId" element={<ErrorBoundary label="Builder"><BuilderRoute /></ErrorBoundary>} />
            <Route path="/runs" element={<ErrorBoundary label="Runs"><RunsPage /></ErrorBoundary>} />
            <Route path="/runs/:runId" element={<ErrorBoundary label="Run Detail"><RunDetailRoute /></ErrorBoundary>} />
            <Route path="/artifacts" element={<ErrorBoundary label="Artifacts"><ArtifactsPage /></ErrorBoundary>} />
            <Route path="/artifacts/:artifactId" element={<ErrorBoundary label="Artifacts"><ArtifactsPage /></ErrorBoundary>} />
            <Route path="/versions" element={<ErrorBoundary label="Versions"><VersionsPage /></ErrorBoundary>} />
            <Route path="/triggers" element={<ErrorBoundary label="Triggers"><TriggersPage /></ErrorBoundary>} />
            <Route path="/approvals" element={<ErrorBoundary label="Approvals"><ApprovalsPage /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </ErrorBoundary>
  );
}
