// ============================================================
// BulkActionBar — floating bar for bulk card operations
// ============================================================

import React from 'react';
import { Trash2, PlayCircle, XCircle } from 'lucide-react';
import { Button } from '@airaie/ui';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onBulkStatusChange,
  onBulkDelete,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40
      flex items-center gap-3 px-4 py-2.5 bg-white border border-surface-border
      shadow-lg rounded-sm"
    >
      <span className="text-xs font-medium text-content-primary">
        {selectedCount} card{selectedCount > 1 ? 's' : ''} selected
      </span>

      <div className="w-px h-5 bg-surface-border" />

      <Button
        variant="ghost"
        size="sm"
        icon={PlayCircle}
        onClick={() => onBulkStatusChange('ready')}
        className="text-xs"
      >
        Mark Ready
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={XCircle}
        onClick={() => onBulkStatusChange('skipped')}
        className="text-xs"
      >
        Skip
      </Button>
      <Button
        variant="ghost"
        size="sm"
        icon={Trash2}
        onClick={onBulkDelete}
        className="text-xs text-red-600 hover:text-red-700"
      >
        Delete
      </Button>

      <div className="w-px h-5 bg-surface-border" />

      <button
        onClick={onClearSelection}
        className="text-xs text-content-muted hover:text-content-primary transition-colors"
      >
        Clear
      </button>
    </div>
  );
};

BulkActionBar.displayName = 'BulkActionBar';

export default BulkActionBar;
