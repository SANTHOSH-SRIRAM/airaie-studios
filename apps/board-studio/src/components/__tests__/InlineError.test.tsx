// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InlineError } from '../studio/InlineError';
import type { APIError } from '@airaie/shared';

const makeError = (overrides: Partial<APIError> = {}): APIError => ({
  status: 500,
  code: 'UNKNOWN',
  message: 'Something went wrong',
  ...overrides,
});

describe('InlineError', () => {
  it('renders error.message as primary text', () => {
    render(<InlineError error={makeError({ message: 'Plan generation failed' })} />);
    expect(screen.getByText('Plan generation failed')).toBeInTheDocument();
  });

  it('renders suggestion when getErrorSuggestion returns non-null', () => {
    render(
      <InlineError error={makeError({ status: 400, code: 'MISSING_INTENT_SPEC', message: 'Missing spec' })} />
    );
    expect(screen.getByText(/IntentSpec/)).toBeInTheDocument();
  });

  it('does NOT show details by default (progressive disclosure D-08)', () => {
    render(<InlineError error={makeError({ code: 'TEST_CODE' })} />);
    expect(screen.queryByText(/"TEST_CODE"/)).not.toBeInTheDocument();
    expect(screen.getByText(/Show details/)).toBeInTheDocument();
  });

  it('clicking "Show details" reveals status code and error code', () => {
    render(<InlineError error={makeError({ status: 404, code: 'RUN_NOT_FOUND' })} />);
    fireEvent.click(screen.getByText(/Show details/));
    expect(screen.getByText(/"RUN_NOT_FOUND"/)).toBeInTheDocument();
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });

  it('renders Retry button when onRetry prop provided', () => {
    const onRetry = vi.fn();
    render(<InlineError error={makeError()} onRetry={onRetry} />);
    const retryBtn = screen.getByText('Retry');
    expect(retryBtn).toBeInTheDocument();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does NOT render Retry button when onRetry is undefined', () => {
    render(<InlineError error={makeError()} />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<InlineError error={makeError()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
