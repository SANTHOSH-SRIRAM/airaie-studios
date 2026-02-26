import React from 'react';
import BoardTabs from './BoardTabs';
import type { AppShellProps } from './types';

export default function AppShell({
  studioName,
  boardTabs,
  children,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-surface-bg overflow-hidden">
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
