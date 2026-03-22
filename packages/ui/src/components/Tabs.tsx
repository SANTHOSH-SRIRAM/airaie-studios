import React, { useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex >= 0) {
        e.preventDefault();
        onChange(tabs[nextIndex].id);
        // Focus the newly active tab button
        const tablist = (e.currentTarget as HTMLElement);
        const buttons = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIndex]?.focus();
      }
    },
    [tabs, activeTab, onChange],
  );

  return (
    <div role="tablist" className={cn('flex border-b border-surface-border', className)} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
              'transition-colors duration-150 rounded-none',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-inset',
              isActive
                ? 'text-brand-primary'
                : 'text-content-tertiary hover:text-content-primary hover:bg-surface-hover'
            )}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
