import React from 'react';
import { LayoutGrid, Search, Bell, HelpCircle, ChevronDown, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  studioName?: string;
  /** Cross-studio context: which studio navigated here */
  fromStudio?: string;
  /** Cross-studio context: source board ID */
  fromBoardId?: string;
  /** Cross-studio context: source card ID */
  fromCardId?: string;
  /** Callback to navigate back to the source studio */
  onNavigateBack?: () => void;
}

const BOARD_STUDIO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BOARD_STUDIO_URL) ||
  'http://localhost:3000';

export default function Header({
  studioName,
  fromStudio,
  fromBoardId,
  fromCardId,
  onNavigateBack,
}: HeaderProps) {
  const handleBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
      return;
    }
    // Default: navigate back to board studio
    if (fromStudio === 'board' && fromBoardId) {
      const url = fromCardId
        ? `${BOARD_STUDIO_URL}/boards/${fromBoardId}/cards/${fromCardId}`
        : `${BOARD_STUDIO_URL}/boards/${fromBoardId}`;
      window.open(url, '_self');
    }
  };

  return (
    <header className="h-[52px] bg-white border-b border-surface-border flex items-center justify-between px-5 shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {fromStudio && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-brand-secondary hover:text-brand-secondary/80 transition-colors mr-1"
            aria-label={`Back to ${fromStudio} studio`}
          >
            <ArrowLeft size={14} />
            <span className="text-xs font-medium capitalize">{fromStudio}</span>
          </button>
        )}
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
        {fromBoardId && (
          <>
            <span className="text-content-muted">/</span>
            <span className="text-xs text-content-muted font-mono">{fromBoardId}</span>
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
        <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="p-1.5 text-content-muted hover:text-content-primary transition-colors" aria-label="Help">
          <HelpCircle size={18} />
        </button>

        {/* Region */}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-content-secondary border border-surface-border hover:bg-surface-hover transition-colors" aria-label="Region selector: US-WEST">
          <span className="font-medium">US-WEST</span>
          <ChevronDown size={12} />
        </button>
      </div>
    </header>
  );
}
