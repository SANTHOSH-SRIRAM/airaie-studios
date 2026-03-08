import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '@airaie/shell';
import type { SidebarSectionType } from '@airaie/shell';
import { Spinner, ErrorBoundary } from '@airaie/ui';
import {
  LayoutDashboard,
  ShieldCheck,
  Workflow,
  Bot,
  Brain,
} from 'lucide-react';

// Lazy-loaded pages
const BoardsPage = lazy(() => import('@pages/BoardsPage'));
const BoardDetailPage = lazy(() => import('@pages/BoardDetailPage'));
const CardDetailPage = lazy(() => import('@pages/CardDetailPage'));
const ApprovalsPage = lazy(() => import('@pages/ApprovalsPage'));
const ReleasePacketPage = lazy(() => import('@pages/ReleasePacketPage'));
const WorkflowsPage = lazy(() => import('@pages/WorkflowsPage'));
const AgentsPage = lazy(() => import('@pages/AgentsPage'));
const MemoryPage = lazy(() => import('@pages/MemoryPage'));

/** Board Studio sidebar sections — matches platform frontend layout */
const BOARD_SIDEBAR_SECTIONS: SidebarSectionType[] = [
  {
    id: 'dashboard',
    label: 'DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    id: 'workspace',
    label: 'WORKSPACE',
    items: [
      { id: 'boards', label: 'Active Boards', bullet: true, path: '/boards' },
    ],
  },
  {
    id: 'build',
    label: 'BUILD',
    items: [
      { id: 'workflows', label: 'Workflows', icon: Workflow, path: '/workflows' },
      { id: 'agents', label: 'Agents', icon: Bot, path: '/agents' },
    ],
  },
  {
    id: 'project-data',
    label: 'PROJECT DATA',
    items: [
      { id: 'approvals', label: 'Approvals', icon: ShieldCheck, path: '/approvals' },
      { id: 'memory', label: 'Memory', icon: Brain, path: '/memory' },
    ],
  },
];

/** Map location to active sidebar item */
function useActiveSidebarItem(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith('/approvals')) return 'approvals';
  if (pathname.startsWith('/memory')) return 'memory';
  if (pathname.startsWith('/workflows')) return 'workflows';
  if (pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/boards')) return 'boards';
  return 'dashboard';
}

/** Fullscreen layout — no shell, pages take the entire viewport */
function FullscreenLayout() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  );
}

/** Shell layout — uses AppShell with sidebar + header */
function ShellLayout() {
  const navigate = useNavigate();
  const activeItem = useActiveSidebarItem();

  return (
    <AppShell
      studioName="Board Studio"
      activeSidebarItem={activeItem}
      sidebarSections={BOARD_SIDEBAR_SECTIONS}
      onNavigate={(path) => navigate(path)}
      showHeader
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Fullscreen routes — board detail & card detail always render without shell */}
      <Route element={<FullscreenLayout />}>
        <Route path="/boards/:boardId" element={<BoardDetailPage />} />
        <Route path="/boards/:boardId/cards/:cardId" element={<ErrorBoundary><CardDetailPage /></ErrorBoundary>} />
        <Route path="/boards/:boardId/release-packet" element={<ErrorBoundary><ReleasePacketPage /></ErrorBoundary>} />
      </Route>

      {/* Shell routes — AppShell handles embedded detection internally */}
      <Route element={<ShellLayout />}>
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/workflows" element={<ErrorBoundary><WorkflowsPage /></ErrorBoundary>} />
        <Route path="/agents" element={<ErrorBoundary><AgentsPage /></ErrorBoundary>} />
        <Route path="/approvals" element={<ErrorBoundary><ApprovalsPage /></ErrorBoundary>} />
        <Route path="/memory" element={<ErrorBoundary><MemoryPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Route>
    </Routes>
  );
}
