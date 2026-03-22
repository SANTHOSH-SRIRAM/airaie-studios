import React from 'react';
import { cn } from '@airaie/ui';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  label: string;
  icon?: LucideIcon;
  bullet?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export default function SidebarItem({
  label, icon: Icon, bullet, active = false, onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2.5 w-full h-9 text-sm transition-colors duration-100 cursor-pointer',
        active
          ? 'text-sidebar-text-active bg-sidebar-hover font-medium border-l-[3px] border-sidebar-active-border pl-[13px] pr-4'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active border-l-[3px] border-transparent pl-4 pr-4'
      )}
    >
      {bullet ? (
        <span className="w-[6px] h-[6px] bg-sidebar-icon shrink-0" />
      ) : Icon ? (
        <Icon size={16} className={cn('shrink-0', active ? 'text-sidebar-text-active' : 'text-sidebar-icon')} />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
