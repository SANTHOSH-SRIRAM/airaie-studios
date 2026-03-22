import React from 'react';
import { LayoutGrid, Search, Bell, HelpCircle, ChevronDown, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  studioName?: string;
  fromStudio?: string;
  fromBoardId?: string;
  fromCardId?: string;
  onNavigateBack?: () => void;
}

const BOARD_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOARD_STUDIO_URL) || 'http://localhost:3000';

export default function Header({ studioName, fromStudio, fromBoardId, fromCardId, onNavigateBack }: HeaderProps) {
  const handleBack = () => {
    if (onNavigateBack) { onNavigateBack(); return; }
    if (fromStudio === 'board' && fromBoardId) {
      const url = fromCardId
        ? `${BOARD_STUDIO_URL}/boards/${fromBoardId}/cards/${fromCardId}`
        : `${BOARD_STUDIO_URL}/boards/${fromBoardId}`;
      window.open(url, '_self');
    }
  };

  return (
    <header className="h-12 bg-white border-b border-card-border flex items-center justify-between px-4 shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        {fromStudio && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-content-primary hover:text-content-secondary transition-colors mr-1"
            aria-label={`Back to ${fromStudio} studio`}
          >
            <ArrowLeft size={14} />
            <span className="text-xs font-medium capitalize">{fromStudio}</span>
          </button>
        )}
        <span className="text-content-helper">ABCworld</span>
        <span className="text-content-placeholder">/</span>
        <span className="text-content-primary font-medium">ENGINEERING</span>
        {studioName && (
          <>
            <span className="text-content-placeholder">/</span>
            <span className="text-content-secondary">{studioName}</span>
          </>
        )}
        {fromBoardId && (
          <>
            <span className="text-content-placeholder">/</span>
            <span className="text-xs text-content-placeholder font-mono">{fromBoardId}</span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 h-8 text-sm text-content-placeholder bg-surface-layer border border-card-border hover:border-content-placeholder transition-colors">
          <Search size={14} />
          <span>Search</span>
          <kbd className="text-[10px] font-mono bg-white border border-card-border px-1.5 py-0.5 ml-2">⌘K</kbd>
        </button>

        <span className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs font-medium text-status-success border border-status-success bg-status-success-bg">
          <span className="w-1.5 h-1.5 bg-status-success rounded-full" />
          SYNCED
        </span>

        <button className="p-1.5 text-content-placeholder hover:text-content-primary transition-colors" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="p-1.5 text-content-placeholder hover:text-content-primary transition-colors" aria-label="Help">
          <HelpCircle size={18} />
        </button>

        <button className="flex items-center gap-1.5 px-2.5 h-8 text-xs text-content-secondary border border-card-border hover:bg-surface-hover transition-colors" aria-label="Region selector">
          <span className="font-medium">US-WEST</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </header>
  );
}
