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
  activeSidebarItem: string;
  boardTabs?: BoardTab[];
  sidebarSections?: SidebarSection[];
  children: React.ReactNode;
}
