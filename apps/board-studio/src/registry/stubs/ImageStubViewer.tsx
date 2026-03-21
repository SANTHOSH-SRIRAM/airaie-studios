import React from 'react';
import { Image } from 'lucide-react';
import type { ViewerProps } from '@/types/viewer';

const ImageStubViewer: React.FC<ViewerProps> = ({ filename, onDownload }) => (
  <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border border-surface-border rounded">
    <Image size={32} className="text-content-muted mb-2" />
    <span className="text-sm font-medium text-content-primary">Image viewer</span>
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

export default ImageStubViewer;
