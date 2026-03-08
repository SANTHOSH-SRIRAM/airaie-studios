// =============================================================
// React hook for real-time event subscriptions
// =============================================================

import { useEffect, useCallback, useRef } from 'react';
import { getEventManager } from './eventManager';
import type { RunEvent } from '../types/events';

/**
 * Subscribe to SSE events for a specific run.
 * Automatically opens/closes the SSE connection based on runId.
 */
export function useRealtimeRun(
  runId: string | null,
  onEvent: (event: RunEvent) => void
): void {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const stableCallback = useCallback(
    (event: RunEvent) => callbackRef.current(event),
    []
  );

  useEffect(() => {
    if (!runId) return;
    const manager = getEventManager();
    return manager.subscribeRun(runId, stableCallback);
  }, [runId, stableCallback]);
}

/**
 * Subscribe to ALL events across all active run streams.
 * Useful for notification systems and global status badges.
 */
export function useRealtimeAll(
  onEvent: (event: RunEvent) => void
): void {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const stableCallback = useCallback(
    (event: RunEvent) => callbackRef.current(event),
    []
  );

  useEffect(() => {
    const manager = getEventManager();
    return manager.subscribeAll(stableCallback);
  }, [stableCallback]);
}
