import React from 'react';
import { Download } from 'lucide-react';

export interface ViewerToolbarProps {
  filename?: string;
  onDownload?: () => void;
  children?: React.ReactNode;
}

export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({ filename, onDownload, children }) => (
  <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-white/80 backdrop-blur-sm">
    <span className="text-xs text-content-muted truncate max-w-[40%]">
      {filename ?? ''}
    </span>
    <div className="flex items-center gap-1">
      {children}
    </div>
    {onDownload && (
      <button
        onClick={onDownload}
        className="p-1.5 rounded hover:bg-slate-100 transition-colors"
        aria-label="Download file"
      >
        <Download size={14} className="text-content-secondary" />
      </button>
    )}
  </div>
);

export default ViewerToolbar;
