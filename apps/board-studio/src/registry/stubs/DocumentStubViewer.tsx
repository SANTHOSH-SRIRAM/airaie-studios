import React from 'react';
import { FileText } from 'lucide-react';
import type { ViewerProps } from '@/types/viewer';

const DocumentStubViewer: React.FC<ViewerProps> = ({ filename, onDownload }) => (
  <div className="h-96 flex flex-col items-center justify-center bg-slate-50 border border-surface-border rounded">
    <FileText size={32} className="text-content-muted mb-2" />
    <span className="text-sm font-medium text-content-primary">Document viewer</span>
    {filename && (
      <span className="text-xs text-content-muted mt-1 truncate max-w-[80%]">{filename}</span>
    )}
    {onDownload && (
      <button
        onClick={onDownload}
        className="mt-3 text-xs text-blue-600 hover:underline"
      >
        Download to view
      </button>
    )}
  </div>
);

export default DocumentStubViewer;
