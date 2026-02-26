import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@airaie/shell';
import type { BoardTab } from '@airaie/shell';
import { PenTool, Play, Package, GitBranch, Zap, Shield } from 'lucide-react';
import BuilderPage from '@pages/BuilderPage';
import RunsPage from '@pages/RunsPage';
import ArtifactsPage from '@pages/ArtifactsPage';
import VersionsPage from '@pages/VersionsPage';
import TriggersPage from '@pages/TriggersPage';
import ApprovalsPage from '@pages/ApprovalsPage';

const boardTabs: BoardTab[] = [
  { id: 'builder', label: 'Builder', icon: PenTool, path: '/builder' },
  { id: 'runs', label: 'Runs', icon: Play, path: '/runs' },
  { id: 'artifacts', label: 'Artifacts', icon: Package, path: '/artifacts' },
  { id: 'versions', label: 'Versions', icon: GitBranch, path: '/versions' },
  { id: 'triggers', label: 'Triggers', icon: Zap, path: '/triggers' },
  { id: 'approvals', label: 'Approvals', icon: Shield, path: '/approvals' },
];

export default function App() {
  return (
    <AppShell
      studioName="Workflow Studio"
      activeSidebarItem="workflows"
      boardTabs={boardTabs}
    >
      <Routes>
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/artifacts" element={<ArtifactsPage />} />
        <Route path="/versions" element={<VersionsPage />} />
        <Route path="/triggers" element={<TriggersPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="*" element={<Navigate to="/builder" replace />} />
      </Routes>
    </AppShell>
  );
}
