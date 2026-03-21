// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { getDefaultTab, useCardTab, CARD_TAB_IDS } from '@hooks/useCardTab';
import type { CardStatus } from '@/types/board';

// Wrapper for hooks that use useSearchParams
function createWrapper(initialEntry = '/') {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialEntry] },
      children
    );
}

describe('getDefaultTab', () => {
  it('returns "intent" for draft status', () => {
    expect(getDefaultTab('draft')).toBe('intent');
  });

  it('returns "intent" for ready status', () => {
    expect(getDefaultTab('ready')).toBe('intent');
  });

  it('returns "plan" for running status', () => {
    expect(getDefaultTab('running')).toBe('plan');
  });

  it('returns "plan" for queued status', () => {
    expect(getDefaultTab('queued')).toBe('plan');
  });

  it('returns "results" for completed status', () => {
    expect(getDefaultTab('completed')).toBe('results');
  });

  it('returns "results" for failed status', () => {
    expect(getDefaultTab('failed')).toBe('results');
  });
});

describe('useCardTab', () => {
  it('returns URL tab when valid tab is in search params', () => {
    const wrapper = createWrapper('/?tab=governance');
    const { result } = renderHook(() => useCardTab('draft'), { wrapper });
    expect(result.current.activeTab).toBe('governance');
  });

  it('returns default tab when no tab in search params', () => {
    const wrapper = createWrapper('/');
    const { result } = renderHook(() => useCardTab('completed'), { wrapper });
    expect(result.current.activeTab).toBe('results');
  });

  it('ignores invalid tab values in search params', () => {
    const wrapper = createWrapper('/?tab=bogus');
    const { result } = renderHook(() => useCardTab('running'), { wrapper });
    expect(result.current.activeTab).toBe('plan');
  });
});

describe('CARD_TAB_IDS', () => {
  it('contains exactly 6 tab ids', () => {
    expect(CARD_TAB_IDS).toHaveLength(6);
  });

  it('includes all expected tab ids', () => {
    expect(CARD_TAB_IDS).toContain('intent');
    expect(CARD_TAB_IDS).toContain('inputs');
    expect(CARD_TAB_IDS).toContain('tool-shelf');
    expect(CARD_TAB_IDS).toContain('plan');
    expect(CARD_TAB_IDS).toContain('results');
    expect(CARD_TAB_IDS).toContain('governance');
  });
});
