import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '@airaie/shell';
import type { SidebarSectionType } from '@airaie/shell';
import { Spinner, ErrorBoundary } from '@airaie/ui';
import {
  LayoutDashboard, ShieldCheck, Workflow, Bot, Brain,
} from 'lucide-react';

const BoardsPage = lazy(() => import('@pages/BoardsPage'));
const BoardDetailPage = lazy(() => import('@pages/BoardDetailPage'));
const CardDetailPage = lazy(() => import('@pages/CardDetailPage'));
const ApprovalsPage = lazy(() => import('@pages/ApprovalsPage'));
const ReleasePacketPage = lazy(() => import('@pages/ReleasePacketPage'));
const WorkflowsPage = lazy(() => import('@pages/WorkflowsPage'));
const AgentsPage = lazy(() => import('@pages/AgentsPage'));
const MemoryPage = lazy(() => import('@pages/MemoryPage'));
const ViewerTestPage = lazy(() => import('@pages/ViewerTestPage'));

const BOARD_SIDEBAR_SECTIONS: SidebarSectionType[] = [
  {
    id: 'dashboard', label: 'DASHBOARD',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' }],
  },
  {
    id: 'workspace', label: 'WORKSPACE',
    items: [{ id: 'boards', label: 'Active Boards', bullet: true, path: '/boards' }],
  },
  {
    id: 'build', label: 'BUILD',
    items: [
      { id: 'workflows', label: 'Workflows', icon: Workflow, path: '/workflows' },
      { id: 'agents', label: 'Agents', icon: Bot, path: '/agents' },
    ],
  },
  {
    id: 'project-data', label: 'PROJECT DATA',
    items: [
      { id: 'approvals', label: 'Approvals', icon: ShieldCheck, path: '/approvals' },
      { id: 'memory', label: 'Memory', icon: Brain, path: '/memory' },
    ],
  },
];

function useActiveSidebarItem(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith('/approvals')) return 'approvals';
  if (pathname.startsWith('/memory')) return 'memory';
  if (pathname.startsWith('/workflows')) return 'workflows';
  if (pathname.startsWith('/agents')) return 'agents';
  if (pathname.startsWith('/boards')) return 'boards';
  return 'dashboard';
}

/** Notify parent (platform iframe host) about fullscreen state.
 *  Uses a debounce to avoid the race condition where ShellLayout cleanup
 *  sends false AFTER FullscreenLayout sends true during route transitions. */
let _fullscreenTimer: ReturnType<typeof setTimeout> | null = null;

function notifyParentFullscreen(fullscreen: boolean) {
  if (window.parent && window.parent !== window) {
    if (_fullscreenTimer) clearTimeout(_fullscreenTimer);
    _fullscreenTimer = setTimeout(() => {
      window.parent.postMessage({ type: 'airaie:studio:fullscreen', fullscreen }, '*');
    }, 50);
  }
}

function useNotifyParentFullscreen(fullscreen: boolean) {
  useEffect(() => {
    notifyParentFullscreen(fullscreen);
  }, [fullscreen]);
}

/** Fullscreen layout — board detail, card detail, release packet */
function FullscreenLayout() {
  useNotifyParentFullscreen(true);
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner /></div>}>
      <Outlet />
    </Suspense>
  );
}

/** Shell layout — sidebar + header for list pages */
function ShellLayout() {
  useNotifyParentFullscreen(false);
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
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Board detail routes — always fullscreen (no sidebar/header) */}
      <Route path="/boards/:boardId" element={<FullscreenLayout />}>
        <Route index element={<BoardDetailPage />} />
        <Route path="cards/:cardId" element={<ErrorBoundary><CardDetailPage /></ErrorBoundary>} />
        <Route path="release-packet" element={<ErrorBoundary><ReleasePacketPage /></ErrorBoundary>} />
      </Route>

      {/* Shell routes — list pages with sidebar */}
      <Route element={<ShellLayout />}>
        <Route path="/boards" element={<BoardsPage />} />
        <Route path="/workflows" element={<ErrorBoundary><WorkflowsPage /></ErrorBoundary>} />
        <Route path="/agents" element={<ErrorBoundary><AgentsPage /></ErrorBoundary>} />
        <Route path="/approvals" element={<ErrorBoundary><ApprovalsPage /></ErrorBoundary>} />
        <Route path="/memory" element={<ErrorBoundary><MemoryPage /></ErrorBoundary>} />
        <Route path="/viewer-test" element={<ErrorBoundary><ViewerTestPage /></ErrorBoundary>} />
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Route>
    </Routes>
  );
}
