import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@airaie/shell';
import { Spinner } from '@airaie/ui';

// Lazy-loaded pages (created in later plans)
const BoardsPage = lazy(() => import('@pages/BoardsPage'));
const BoardDetailPage = lazy(() => import('@pages/BoardDetailPage'));
const CardDetailPage = lazy(() => import('@pages/CardDetailPage'));
const ApprovalsPage = lazy(() => import('@pages/ApprovalsPage'));

export default function App() {
  return (
    <AppShell studioName="Board Studio" activeSidebarItem="boards">
      <Suspense fallback={<div className="flex items-center justify-center h-64"><Spinner /></div>}>
        <Routes>
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/boards/:boardId" element={<BoardDetailPage />} />
          <Route path="/boards/:boardId/cards/:cardId" element={<CardDetailPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
