import React from 'react';
import { Download } from 'lucide-react';
import type { ViewerProps } from '@/types/viewer';

const DownloadStubViewer: React.FC<ViewerProps> = ({ filename, onDownload }) => (
  <div className="h-16 flex items-center justify-center gap-3 bg-slate-50 border border-surface-border rounded px-4">
    <Download size={20} className="text-content-muted shrink-0" />
    <span className="text-sm font-medium text-content-primary truncate">
      {filename ?? 'Download file'}
    </span>
    {onDownload && (
      <button
        onClick={onDownload}
        className="ml-auto text-xs text-blue-600 hover:underline shrink-0"
      >
        Download to view
      </button>
    )}
  </div>
);

export default DownloadStubViewer;
