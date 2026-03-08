import React from 'react';
import {
  LayoutDashboard,
  Users,
  Workflow,
  Bot,
  Database,
  FileText,
  FolderOpen,
  Settings,
} from 'lucide-react';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';
import UserCard from './UserCard';

import type { SidebarSection as SidebarSectionType } from './types';

interface SidebarProps {
  activeSidebarItem: string;
  onNavigate?: (path: string) => void;
  sections?: SidebarSectionType[];
}

/** External URLs for each studio — used when navigating to a *different* studio.
 *  Reads from VITE_ env vars at build time with localhost fallbacks for dev. */
const STUDIO_URLS: Record<string, string> = {
  workflows: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORKFLOW_STUDIO_URL) || 'http://localhost:3001',
  agents: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AGENT_STUDIO_URL) || 'http://localhost:3002',
};

const SECTIONS = [
  {
    id: 'dashboard',
    label: 'DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
      { id: 'community', label: 'Community', icon: Users, path: '/community' },
    ],
  },
  {
    id: 'workspace',
    label: 'WORKSPACE',
    items: [
      { id: 'project-alpha', label: 'Project Alpha', bullet: true, path: '/workspace/alpha' },
      { id: 'turbine-sim', label: 'Turbine Sim', bullet: true, path: '/workspace/turbine' },
      { id: 'thermal-analysis', label: 'Thermal Analysis', bullet: true, path: '/workspace/thermal' },
    ],
  },
  {
    id: 'build',
    label: 'BUILD',
    items: [
      { id: 'workflows', label: 'Workflows', icon: Workflow, path: '/builder' },
      { id: 'agents', label: 'Agents', icon: Bot, path: '/builder' },
    ],
  },
  {
    id: 'project-data',
    label: 'PROJECT DATA',
    items: [
      { id: 'datasets', label: 'Datasets', icon: Database, path: '/datasets' },
      { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
      { id: 'files', label: 'Files', icon: FolderOpen, path: '/files' },
    ],
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
];

export default function Sidebar({ activeSidebarItem, onNavigate, sections }: SidebarProps) {
  const navSections = sections ?? SECTIONS;

  return (
    <aside className="w-[230px] h-screen bg-sidebar-bg border-r border-surface-border flex flex-col shrink-0" aria-label="Main navigation">
      {/* Logo */}
      <div className="h-[52px] px-4 border-b border-surface-border flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-secondary text-white flex items-center justify-center text-[10px] font-bold tracking-tight">
            A
          </div>
          <span className="text-sm font-bold text-content-primary tracking-wide">
            AIRAIE.CAD
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide" aria-label="Studio navigation">
        {navSections.map((section) => (
          <SidebarSection key={section.id} label={section.label}>
            {section.items.map((item) => (
              <SidebarItem
                key={item.id}
                label={item.label}
                icon={'icon' in item ? item.icon : undefined}
                bullet={'bullet' in item ? item.bullet : undefined}
                active={activeSidebarItem === item.id}
                onClick={() => {
                  // Always route internally first — if the current studio has
                  // a page for this item (e.g. /workflows), navigate there.
                  // The page itself can link out to the full studio.
                  if (item.path) onNavigate?.(item.path);
                }}
              />
            ))}
          </SidebarSection>
        ))}
      </nav>

      {/* User */}
      <UserCard />
    </aside>
  );
}
