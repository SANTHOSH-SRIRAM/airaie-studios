import React from 'react';
import { LogOut, Settings } from 'lucide-react';

export default function UserCard() {
  return (
    <div className="px-4 py-3 border-t border-surface-border">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-secondary text-white flex items-center justify-center text-xs font-bold rounded-full shrink-0">
          SA
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-content-primary truncate">
            Santhosh A.
          </p>
          <p className="text-[11px] text-content-muted truncate">
            Admin
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors" aria-label="Settings">
            <Settings size={14} />
          </button>
          <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors" aria-label="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
