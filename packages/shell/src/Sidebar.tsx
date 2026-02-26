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

interface SidebarProps {
  activeSidebarItem: string;
  onNavigate?: (path: string) => void;
}

/** External URLs for each studio — used when navigating to a *different* studio */
const STUDIO_URLS: Record<string, string> = {
  workflows: 'http://localhost:3001',
  agents: 'http://localhost:3002',
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

export default function Sidebar({ activeSidebarItem, onNavigate }: SidebarProps) {
  return (
    <aside className="w-[230px] h-screen bg-sidebar-bg border-r border-surface-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-secondary text-white flex items-center justify-center text-[10px] font-bold tracking-tight">
            AC
          </div>
          <span className="text-sm font-bold text-content-primary tracking-wide">
            AIRAIE.CAD
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {SECTIONS.map((section) => (
          <SidebarSection key={section.id} label={section.label}>
            {section.items.map((item) => (
              <SidebarItem
                key={item.id}
                label={item.label}
                icon={'icon' in item ? item.icon : undefined}
                bullet={'bullet' in item ? item.bullet : undefined}
                active={activeSidebarItem === item.id}
                onClick={() => {
                  // If this item is a different studio, open it in a new tab
                  const externalUrl = STUDIO_URLS[item.id];
                  if (externalUrl && item.id !== activeSidebarItem) {
                    window.open(externalUrl, '_blank');
                  } else {
                    onNavigate?.(item.path);
                  }
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
