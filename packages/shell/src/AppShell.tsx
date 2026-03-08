import React from 'react';
import { ArrowLeft } from 'lucide-react';
import BoardTabs from './BoardTabs';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEmbedded } from './useEmbedded';
import { isSafeUrl } from '@airaie/shared';
import type { AppShellProps } from './types';

const BOARD_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOARD_STUDIO_URL) ||
  'http://localhost:3000';

export default function AppShell({
  studioName,
  activeSidebarItem,
  boardTabs,
  sidebarSections,
  onNavigate,
  showHeader,
  children,
}: AppShellProps) {
  const embedded = useEmbedded();

  // Read cross-studio context from URL params
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const fromStudio = params?.get('from') ?? undefined;
  const fromBoardId = params?.get('boardId') ?? undefined;
  const fromCardId = params?.get('cardId') ?? undefined;

  const handleBack = () => {
    const allowed = [BOARD_STUDIO_URL];
    if (fromStudio === 'board' && fromBoardId) {
      const url = fromCardId
        ? `${BOARD_STUDIO_URL}/boards/${fromBoardId}/cards/${fromCardId}`
        : `${BOARD_STUDIO_URL}/boards/${fromBoardId}`;
      if (isSafeUrl(url, allowed)) window.open(url, '_self');
    } else {
      const url = `${BOARD_STUDIO_URL}/boards`;
      if (isSafeUrl(url, allowed)) window.open(url, '_self');
    }
  };

  // --- Sidebar + Header layout (board-studio pattern) ---
  if (sidebarSections) {
    if (embedded) {
      // Embedded: no sidebar/header, just padded content
      return (
        <div className="flex flex-col h-screen overflow-hidden bg-surface-bg">
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      );
    }

    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activeSidebarItem={activeSidebarItem ?? ''}
          onNavigate={onNavigate}
          sections={sidebarSections}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          {showHeader && <Header studioName={studioName} />}
          <main className="flex-1 overflow-auto p-6 bg-surface-bg bg-grid">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // --- BoardTabs layout (agent/workflow studios) ---
  return (
    <div className="flex flex-col h-screen bg-surface-bg overflow-hidden">
      {/* Cross-studio breadcrumb banner */}
      {fromStudio && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-hover border-b border-surface-border text-xs">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-brand-secondary hover:text-brand-secondary/80 transition-colors"
          >
            <ArrowLeft size={12} />
            <span className="font-medium capitalize">Back to {fromStudio} studio</span>
          </button>
          {fromBoardId && (
            <>
              <span className="text-content-muted">/</span>
              <span className="text-content-muted font-mono">{fromBoardId}</span>
            </>
          )}
        </div>
      )}

      {boardTabs && boardTabs.length > 0 && (
        <BoardTabs tabs={boardTabs} studioName={studioName} />
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
