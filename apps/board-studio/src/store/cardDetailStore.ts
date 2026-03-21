// ============================================================
// Card Detail Session Store — per-card tab & scroll persistence
// Session-only (no localStorage persist) per D-09
// ============================================================

import { create } from 'zustand';
import type { CardTabId } from '@hooks/useCardTab';

export interface CardDetailSession {
  tab?: CardTabId;
  scrollTop?: number;
}

interface CardDetailStore {
  sessions: Record<string, CardDetailSession>;
  setSession: (cardId: string, partial: Partial<CardDetailSession>) => void;
  getSession: (cardId: string) => CardDetailSession | undefined;
}

export const useCardDetailStore = create<CardDetailStore>()((set, get) => ({
  sessions: {},

  setSession: (cardId, partial) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [cardId]: { ...state.sessions[cardId], ...partial },
      },
    })),

  getSession: (cardId) => get().sessions[cardId],
}));
