// ============================================================
// useCardTab — Tab state with URL persistence and state-driven defaults
// ============================================================

import { useSearchParams } from 'react-router-dom';
import type { CardStatus } from '@/types/board';

export const CARD_TAB_IDS = ['intent', 'inputs', 'tool-shelf', 'plan', 'results', 'governance'] as const;
export type CardTabId = (typeof CARD_TAB_IDS)[number];

/**
 * Returns the default tab based on card execution state.
 * - idle/draft/ready → Intent (configure the card)
 * - queued/running → Plan (watch execution)
 * - completed/failed → Results (see outputs)
 */
export function getDefaultTab(status: CardStatus): CardTabId {
  switch (status) {
    case 'running':
    case 'queued':
      return 'plan';
    case 'completed':
    case 'failed':
      return 'results';
    default:
      return 'intent';
  }
}

/**
 * Hook managing active tab with URL ?tab= persistence and state-driven defaults.
 * If URL has a valid tab, use it. Otherwise, derive from card status.
 */
export function useCardTab(cardStatus: CardStatus) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const defaultTab = getDefaultTab(cardStatus);
  const activeTab: CardTabId =
    urlTab && CARD_TAB_IDS.includes(urlTab as CardTabId)
      ? (urlTab as CardTabId)
      : defaultTab;

  const setTab = (tabId: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tabId);
        return next;
      },
      { replace: true }
    );
  };

  return { activeTab, setTab };
}
