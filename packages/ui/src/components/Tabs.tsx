import React from 'react';
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
  return (
    <div role="tablist" className={cn('flex border-b border-surface-border', className)}>
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
              'focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-inset',
              isActive
                ? 'text-brand-secondary'
                : 'text-content-tertiary hover:text-content-primary hover:bg-surface-hover'
            )}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-secondary" />
            )}
          </button>
        );
      })}
    </div>
  );
};

Tabs.displayName = 'Tabs';

export default Tabs;
