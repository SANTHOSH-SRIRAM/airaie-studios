import React from 'react';
import { LayoutGrid, Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';

interface HeaderProps {
  studioName?: string;
}

export default function Header({ studioName }: HeaderProps) {
  return (
    <header className="h-[52px] bg-white border-b border-surface-border flex items-center justify-between px-5 shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <LayoutGrid size={16} className="text-content-muted" />
        <span className="text-content-muted">ABCworld</span>
        <span className="text-content-muted">/</span>
        <span className="text-brand-secondary font-medium">ENGINEERING</span>
        {studioName && (
          <>
            <span className="text-content-muted">/</span>
            <span className="text-content-primary font-medium">{studioName}</span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-content-muted bg-surface-hover border border-surface-border hover:border-content-muted transition-colors">
          <Search size={14} />
          <span>Search</span>
          <kbd className="text-[10px] font-mono bg-white border border-surface-border px-1.5 py-0.5 ml-2">
            ⌘K
          </kbd>
        </button>

        {/* Sync badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 border border-green-300 bg-white">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          SYNCED
        </span>

        {/* Icons */}
        <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors">
          <Bell size={18} />
        </button>
        <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors">
          <HelpCircle size={18} />
        </button>

        {/* Region */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-content-secondary border border-surface-border hover:bg-surface-hover transition-colors">
          <span className="font-medium">US-WEST</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </header>
  );
}
