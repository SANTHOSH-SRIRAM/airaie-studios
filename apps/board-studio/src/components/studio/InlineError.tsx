// ============================================================
// InlineError — Contextual inline error display with
// progressive disclosure (D-08) and actionable suggestions (D-09)
// ============================================================

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { APIError } from '@airaie/shared';
import { getErrorSuggestion } from '@/constants/errorSuggestions';

export interface InlineErrorProps {
  error: APIError;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, className = '' }: InlineErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const suggestion = getErrorSuggestion(error.status, error.code);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`} role="alert">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-800 font-medium">{error.message}</p>
          {suggestion && (
            <p className="text-xs text-red-600 mt-1">
              {suggestion.message}
              {suggestion.action && <span className="font-medium"> {suggestion.action}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 text-xs text-red-700 hover:text-red-900 font-medium"
          >
            <RotateCcw size={12} /> Retry
          </button>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
        >
          {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showDetails ? 'Hide' : 'Show'} details
        </button>
      </div>

      {showDetails && (
        <pre className="mt-2 p-2 bg-red-100 rounded text-[10px] text-red-900 overflow-x-auto">
          {JSON.stringify(
            { status: error.status, code: error.code, details: error.details, field: error.field },
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
}
