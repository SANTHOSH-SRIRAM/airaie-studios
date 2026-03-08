// =============================================================
// Shared Real-time Event Manager
// Aggregates per-run SSE streams + polls for cross-studio events
// =============================================================

import { createRunStream } from '../api/sse';
import type { RunEvent, RunEventType } from '../types/events';

export type EventCallback = (event: RunEvent) => void;
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

interface ActiveStream {
  runId: string;
  cleanup: () => void;
}

interface EventManagerOptions {
  /** Poll interval for pending approvals/notifications (ms, default 30s) */
  pollInterval?: number;
}

class EventManager {
  private streams = new Map<string, ActiveStream>();
  private listeners = new Map<string, Set<EventCallback>>();
  private globalListeners = new Set<EventCallback>();
  private statusListeners = new Set<(status: ConnectionStatus) => void>();

  /** Subscribe to events for a specific run */
  subscribeRun(runId: string, callback: EventCallback): () => void {
    // Track the listener
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(callback);

    // Start streaming if not already active
    if (!this.streams.has(runId)) {
      const cleanup = createRunStream(
        runId,
        (event) => this.dispatch(runId, event),
        () => this.handleStreamError(runId)
      );
      this.streams.set(runId, { runId, cleanup });
    }

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(runId);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(runId);
          this.closeStream(runId);
        }
      }
    };
  }

  /** Subscribe to ALL events across all runs */
  subscribeAll(callback: EventCallback): () => void {
    this.globalListeners.add(callback);
    return () => {
      this.globalListeners.delete(callback);
    };
  }

  /** Get number of active streams */
  get activeStreamCount(): number {
    return this.streams.size;
  }

  /** Close all streams and clean up */
  destroy(): void {
    for (const [runId] of this.streams) {
      this.closeStream(runId);
    }
    this.listeners.clear();
    this.globalListeners.clear();
    this.statusListeners.clear();
  }

  private dispatch(runId: string, event: RunEvent): void {
    // Per-run listeners
    const set = this.listeners.get(runId);
    if (set) {
      for (const cb of set) {
        try {
          cb(event);
        } catch {
          // Don't let one listener break others
        }
      }
    }

    // Global listeners
    for (const cb of this.globalListeners) {
      try {
        cb(event);
      } catch {
        // Don't let one listener break others
      }
    }

    // Auto-close on terminal events
    const terminalEvents: RunEventType[] = ['RUN_COMPLETED', 'RUN_FAILED', 'RUN_CANCELED'];
    if (terminalEvents.includes(event.event_type)) {
      this.closeStream(runId);
    }
  }

  private closeStream(runId: string): void {
    const stream = this.streams.get(runId);
    if (stream) {
      stream.cleanup();
      this.streams.delete(runId);
    }
  }

  private handleStreamError(runId: string): void {
    this.closeStream(runId);
  }
}

// Singleton instance
let instance: EventManager | null = null;

export function getEventManager(): EventManager {
  if (!instance) {
    instance = new EventManager();
  }
  return instance;
}

export function destroyEventManager(): void {
  instance?.destroy();
  instance = null;
}
