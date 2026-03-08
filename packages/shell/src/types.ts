import type { LucideIcon } from 'lucide-react';

export interface BoardTab {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  bullet?: boolean; // square bullet instead of icon
}

export interface SidebarSection {
  id: string;
  label: string;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface AppShellProps {
  studioName?: string;
  activeSidebarItem?: string;
  /** Tab-based navigation (agent/workflow studios) */
  boardTabs?: BoardTab[];
  /** Sidebar sections — when provided, renders sidebar + header layout */
  sidebarSections?: SidebarSection[];
  /** Router navigate callback for sidebar navigation */
  onNavigate?: (path: string) => void;
  /** Show the header bar (used with sidebar layout) */
  showHeader?: boolean;
  children: React.ReactNode;
}
