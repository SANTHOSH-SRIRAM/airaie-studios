import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@airaie/shell';
import type { BoardTab } from '@airaie/shell';
import { PenTool, ShieldCheck, MessageSquare, FlaskConical, GitBranch } from 'lucide-react';
import BuilderPage from '@pages/BuilderPage';
import PolicyPage from '@pages/PolicyPage';
import PlaygroundPage from '@pages/PlaygroundPage';
import EvalsPage from '@pages/EvalsPage';
import VersionsPage from '@pages/VersionsPage';

const boardTabs: BoardTab[] = [
  { id: 'builder', label: 'Builder', icon: PenTool, path: '/builder' },
  { id: 'policy', label: 'Policy', icon: ShieldCheck, path: '/policy' },
  { id: 'playground', label: 'Playground', icon: MessageSquare, path: '/playground' },
  { id: 'evals', label: 'Evals', icon: FlaskConical, path: '/evals' },
  { id: 'versions', label: 'Versions', icon: GitBranch, path: '/versions' },
];

export default function App() {
  return (
    <AppShell
      studioName="Agent Studio"
      activeSidebarItem="agents"
      boardTabs={boardTabs}
    >
      <Routes>
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/policy" element={<PolicyPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/evals" element={<EvalsPage />} />
        <Route path="/versions" element={<VersionsPage />} />
        <Route path="*" element={<Navigate to="/builder" replace />} />
      </Routes>
    </AppShell>
  );
}
