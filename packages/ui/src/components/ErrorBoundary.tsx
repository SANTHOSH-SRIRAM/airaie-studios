import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  label?: string;
  /** Optional fallback render function */
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.label ? ` - ${this.props.label}` : ''}]`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

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
                transition-colors rounded-none"
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
