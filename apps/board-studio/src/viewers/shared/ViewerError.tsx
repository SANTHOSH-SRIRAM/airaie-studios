import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ViewerErrorProps {
  message: string;
  filename?: string;
  onRetry?: () => void;
}

export const ViewerError: React.FC<ViewerErrorProps> = ({ message, filename, onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center h-full">
    <AlertTriangle size={32} className="text-red-400" />
    <p className="text-sm text-content-primary">{message}</p>
    {filename && (
      <p className="text-xs text-content-muted">{filename}</p>
    )}
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 text-xs text-blue-600 hover:underline"
      >
        Retry
      </button>
    )}
  </div>
);

export default ViewerError;
