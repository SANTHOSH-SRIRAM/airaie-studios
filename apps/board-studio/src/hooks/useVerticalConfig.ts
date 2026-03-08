// ============================================================
// useVerticalConfig — resolves vertical theme & intent config
// ============================================================

import { useMemo } from 'react';
import { VERTICAL_REGISTRY, BOARD_TYPE_TO_VERTICAL } from '@/constants/vertical-registry';
import type { VerticalTheme, IntentCardConfig } from '@/types/vertical-registry';
import type { Card, Board } from '@/types/board';

export interface VerticalConfigResult {
  /** The visual theme for this vertical (null if unknown vertical) */
  theme: VerticalTheme | null;
  /** The intent-specific card config (null if no intent type or unknown) */
  intentConfig: IntentCardConfig | null;
  /** The vertical slug (null if unknown) */
  verticalSlug: string | null;
}

/**
 * Derives the vertical slug from board data.
 * Priority: board.vertical_id > parse from board.type prefix
 */
export function resolveVerticalSlug(board?: Board | null): string | null {
  if (!board) return null;

  // 1. Direct vertical_id
  if (board.vertical_id) {
    // Check if it's a known slug directly
    if (VERTICAL_REGISTRY[board.vertical_id]) {
      return board.vertical_id;
    }
    // Check the prefix mapping
    const mapped = BOARD_TYPE_TO_VERTICAL[board.vertical_id];
    if (mapped) return mapped;
  }

  // 2. Parse from board.type — try matching known prefixes
  if (board.type) {
    const typeLower = board.type.toLowerCase();

    // Direct match
    if (VERTICAL_REGISTRY[typeLower]) return typeLower;

    // Try splitting on common separators and checking first segment
    const segments = typeLower.split(/[-_.]/);
    for (const segment of segments) {
      const mapped = BOARD_TYPE_TO_VERTICAL[segment];
      if (mapped) return mapped;
    }

    // Substring match as last resort
    for (const [prefix, slug] of Object.entries(BOARD_TYPE_TO_VERTICAL)) {
      if (typeLower.includes(prefix)) return slug;
    }
  }

  return null;
}

/**
 * Hook to resolve vertical configuration for a card on a board.
 * Returns theme, intentConfig, and verticalSlug — all nullable for graceful fallback.
 */
export function useVerticalConfig(card?: Card | null, board?: Board | null): VerticalConfigResult {
  return useMemo(() => {
    const verticalSlug = resolveVerticalSlug(board);

    if (!verticalSlug) {
      return { theme: null, intentConfig: null, verticalSlug: null };
    }

    const entry = VERTICAL_REGISTRY[verticalSlug];
    if (!entry) {
      return { theme: null, intentConfig: null, verticalSlug: null };
    }

    const theme = entry.theme;

    // Resolve intent config from card's intent_type
    let intentConfig: IntentCardConfig | null = null;
    if (card?.intent_type && entry.intentConfigs[card.intent_type]) {
      intentConfig = entry.intentConfigs[card.intent_type];
    }

    return { theme, intentConfig, verticalSlug };
  }, [card?.intent_type, board?.vertical_id, board?.type]);
}

/**
 * Utility to extract a value from a card using a dot-path key.
 * e.g. extractFieldValue(card, 'config.solver') → card.config.solver
 */
export function extractFieldValue(card: Card, keyPath: string): unknown {
  const parts = keyPath.split('.');
  let current: unknown = card;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Format a field value according to its format definition.
 */
export function formatFieldValue(
  value: unknown,
  format: string,
  unit?: string
): string {
  if (value == null || value === undefined) return '--';

  switch (format) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      const formatted = num % 1 === 0 ? num.toString() : num.toFixed(3);
      return unit ? `${formatted} ${unit}` : formatted;
    }
    case 'percentage': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      // If value is already 0-100, display as-is; if 0-1, multiply by 100
      const pct = num <= 1 && num >= 0 ? (num * 100).toFixed(1) : num.toFixed(1);
      return `${pct}%`;
    }
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'duration': {
      const ms = Number(value);
      if (isNaN(ms)) return String(value);
      if (ms < 1000) return `${ms}ms`;
      if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
      return `${(ms / 60000).toFixed(1)}m`;
    }
    case 'progress': {
      const num = Number(value);
      if (isNaN(num)) return String(value);
      return `${Math.round(num)}%`;
    }
    case 'text':
    default:
      return String(value);
  }
}
