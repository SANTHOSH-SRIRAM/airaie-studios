import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@airaie/ui';
import type { BoardTab } from './types';

interface BoardTabsProps {
  tabs: BoardTab[];
  studioName?: string;
}

export default function BoardTabs({ tabs, studioName }: BoardTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.id ?? tabs[0]?.id;

  return (
    <div className="bg-white border-b border-surface-border px-5">
      {studioName && (
        <div className="pt-3 pb-1">
          <h1 className="text-sm font-bold text-content-primary uppercase tracking-wide">
            {studioName}
          </h1>
        </div>
      )}
      <div className="flex items-center gap-1" role="tablist" aria-label={studioName ? `${studioName} navigation` : 'Studio navigation'}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
                isActive
                  ? 'text-brand-secondary border-brand-secondary'
                  : 'text-content-tertiary border-transparent hover:text-content-primary hover:border-content-muted'
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
