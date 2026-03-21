// ============================================================
// Error code to suggestion mapping for inline error display
// ============================================================

export interface ErrorSuggestion {
  message: string;
  action?: string;
}

/**
 * Map of HTTP status → error code → suggestion.
 * Status '*' under a code group acts as wildcard for that status.
 */
export const ERROR_SUGGESTIONS: Record<string, Record<string, ErrorSuggestion>> = {
  '404': {
    RUN_NOT_FOUND: {
      message: 'The run may still be in progress or has been deleted.',
      action: 'Try refreshing.',
    },
    ARTIFACT_NOT_FOUND: {
      message: 'This artifact may not have been generated yet.',
      action: 'Check if the run completed successfully.',
    },
    INTENT_SPEC_NOT_FOUND: {
      message: 'No IntentSpec found for this card.',
      action: 'Contact your admin to set up the intent specification.',
    },
    CARD_NOT_FOUND: {
      message: 'This card no longer exists.',
      action: 'Return to the board view.',
    },
  },
  '400': {
    INVALID_PLAN: {
      message: 'The plan configuration is invalid.',
      action: 'Check that all required inputs are provided and valid.',
    },
    MISSING_INTENT_SPEC: {
      message: 'This card needs an IntentSpec before plan generation.',
      action: 'Contact your admin.',
    },
    VALIDATION_FAILED: {
      message: 'Input validation failed.',
      action: 'Review the highlighted fields and correct any errors.',
    },
  },
  '403': {
    FORBIDDEN: {
      message: "You don't have permission for this action.",
      action: 'Check your project role.',
    },
  },
  '409': {
    CONFLICT: {
      message: 'This resource was modified by another user.',
      action: 'Refresh and try again.',
    },
  },
  '500': {
    '*': {
      message: 'An unexpected server error occurred.',
      action: 'Try again in a few moments.',
    },
  },
};

/**
 * Look up an actionable suggestion for a given HTTP status and error code.
 * Returns null when no matching suggestion exists.
 */
export function getErrorSuggestion(status: number, code?: string): ErrorSuggestion | null {
  const statusKey = String(status);
  const statusMap = ERROR_SUGGESTIONS[statusKey];

  if (statusMap) {
    if (code && statusMap[code]) return statusMap[code];
    if (statusMap['*']) return statusMap['*'];
  }

  // Fallback: any 5xx maps to the 500 wildcard
  if (status >= 500 && ERROR_SUGGESTIONS['500']?.['*']) {
    return ERROR_SUGGESTIONS['500']['*'];
  }

  return null;
}
