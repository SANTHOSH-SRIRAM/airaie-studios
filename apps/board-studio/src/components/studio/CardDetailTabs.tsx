// ============================================================
// CardDetailTabs — 6-tab navigation with Lucide icons
// ============================================================

import React from 'react';
import { Tabs } from '@airaie/ui';
import type { Tab } from '@airaie/ui';
import {
  Target,
  Settings,
  Wrench,
  GitBranch,
  BarChart3,
  Shield,
} from 'lucide-react';

export const CARD_TABS: Tab[] = [
  { id: 'intent', label: 'Intent', icon: Target },
  { id: 'inputs', label: 'Inputs', icon: Settings },
  { id: 'tool-shelf', label: 'Tool Shelf', icon: Wrench },
  { id: 'plan', label: 'Plan', icon: GitBranch },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'governance', label: 'Governance', icon: Shield },
];

export interface CardDetailTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

const CardDetailTabs: React.FC<CardDetailTabsProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="flex flex-col h-full">
      <Tabs tabs={CARD_TABS} activeTab={activeTab} onChange={onTabChange} />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

CardDetailTabs.displayName = 'CardDetailTabs';

export default CardDetailTabs;
