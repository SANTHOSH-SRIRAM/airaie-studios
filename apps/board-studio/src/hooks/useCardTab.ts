// ============================================================
// useCardTab — Tab state with URL persistence and state-driven defaults
// Integrates cardDetailStore for per-card tab restoration (D-10)
// ============================================================

import { useSearchParams } from 'react-router-dom';
import type { CardStatus } from '@/types/board';
import { useCardDetailStore } from '@store/cardDetailStore';

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
 * Priority: URL ?tab= > Zustand stored tab > status-derived default.
 * When cardId is provided, tab changes are persisted to Zustand store.
 */
export function useCardTab(cardStatus: CardStatus, cardId?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getSession, setSession } = useCardDetailStore();

  const urlTab = searchParams.get('tab');
  const storedTab = cardId ? getSession(cardId)?.tab : undefined;
  const defaultTab = getDefaultTab(cardStatus);

  // Priority: URL ?tab= > stored tab > status-derived default
  const activeTab: CardTabId =
    urlTab && CARD_TAB_IDS.includes(urlTab as CardTabId)
      ? (urlTab as CardTabId)
      : storedTab && CARD_TAB_IDS.includes(storedTab)
        ? storedTab
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
    // Persist to Zustand store if cardId is provided
    if (cardId && CARD_TAB_IDS.includes(tabId as CardTabId)) {
      setSession(cardId, { tab: tabId as CardTabId });
    }
  };

  return { activeTab, setTab };
}
