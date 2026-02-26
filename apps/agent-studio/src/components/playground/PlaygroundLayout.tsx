import React from 'react';
import { cn } from '@airaie/ui';
import SessionManager from './SessionManager';
import DryRunToggle from './DryRunToggle';

export interface PlaygroundLayoutProps {
  chatPanel: React.ReactNode;
  inspectorPanel: React.ReactNode;
  className?: string;
}

const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({
  chatPanel,
  inspectorPanel,
  className,
}) => {
  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-border bg-white">
        <SessionManager />
        <div className="flex-1" />
        <DryRunToggle />
      </div>

      {/* 2-panel split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat — 60% */}
        <div className="flex-[3] flex flex-col overflow-hidden border-r border-surface-border">
          {chatPanel}
        </div>
        {/* Inspector — 40% */}
        <div className="flex-[2] flex flex-col overflow-hidden">
          {inspectorPanel}
        </div>
      </div>
    </div>
  );
};

PlaygroundLayout.displayName = 'PlaygroundLayout';

export default PlaygroundLayout;
