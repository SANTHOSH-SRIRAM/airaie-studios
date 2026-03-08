// ============================================================
// StudioErrorBoundary -- catches errors in lazy-loaded components
// ============================================================

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the error card (e.g. "Canvas", "Inspector") */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class-based error boundary that wraps React.Suspense boundaries for
 * lazy-loaded studio components. Shows a friendly message with a Retry
 * button that resets state and re-renders children.
 */
export default class StudioErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[StudioErrorBoundary${this.props.label ? ` - ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[120px] p-4">
          <div className="flex flex-col items-center gap-2 text-center max-w-sm">
            <AlertCircle size={24} className="text-status-danger" />
            <p className="text-sm font-medium text-content-primary">
              {this.props.label ? `Failed to load ${this.props.label}` : 'Something went wrong'}
            </p>
            <p className="text-xs text-content-tertiary">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                text-content-secondary border border-surface-border hover:bg-surface-hover
                transition-colors"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
