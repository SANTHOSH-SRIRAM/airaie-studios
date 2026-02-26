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
  label,
  icon: Icon,
  bullet,
  active = false,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 text-sm transition-colors duration-150 cursor-pointer',
        active
          ? 'text-sidebar-text-active bg-blue-50 font-medium border-l-[3px] border-sidebar-active'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-content-primary border-l-[3px] border-transparent'
      )}
    >
      {bullet ? (
        <span className="w-[6px] h-[6px] bg-content-muted rounded-sm shrink-0" />
      ) : Icon ? (
        <Icon size={16} className="shrink-0" />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}
