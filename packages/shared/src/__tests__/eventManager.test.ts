import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEventManager, destroyEventManager } from '../realtime/eventManager';
import type { RunEvent } from '../types/events';

// Mock createRunStream
vi.mock('../api/sse', () => ({
  createRunStream: vi.fn((runId: string, onEvent: (e: RunEvent) => void, onError?: () => void) => {
    // Store the callback so tests can trigger events
    (globalThis as any).__mockStreamCallbacks = (globalThis as any).__mockStreamCallbacks || {};
    (globalThis as any).__mockStreamCallbacks[runId] = { onEvent, onError };
    return () => {
      delete (globalThis as any).__mockStreamCallbacks?.[runId];
    };
  }),
}));

function emitEvent(runId: string, event: RunEvent) {
  (globalThis as any).__mockStreamCallbacks?.[runId]?.onEvent(event);
}

function makeEvent(type: string, runId: string): RunEvent {
  return {
    event_id: `evt_${Date.now()}`,
    event_type: type as any,
    timestamp: new Date().toISOString(),
    run_id: runId,
    payload: {},
  };
}

describe('EventManager', () => {
  beforeEach(() => {
    destroyEventManager();
    (globalThis as any).__mockStreamCallbacks = {};
  });

  it('subscribes to run events', () => {
    const manager = getEventManager();
    const cb = vi.fn();
    manager.subscribeRun('run_1', cb);

    emitEvent('run_1', makeEvent('NODE_STARTED', 'run_1'));
    expect(cb).toHaveBeenCalledOnce();
  });

  it('unsubscribes correctly', () => {
    const manager = getEventManager();
    const cb = vi.fn();
    const unsub = manager.subscribeRun('run_1', cb);
    unsub();

    // Stream should be closed, no more events
    expect(manager.activeStreamCount).toBe(0);
  });

  it('global listeners receive all events', () => {
    const manager = getEventManager();
    const globalCb = vi.fn();
    manager.subscribeAll(globalCb);
    manager.subscribeRun('run_1', () => {});

    emitEvent('run_1', makeEvent('NODE_COMPLETED', 'run_1'));
    expect(globalCb).toHaveBeenCalledOnce();
  });

  it('auto-closes on terminal events', () => {
    const manager = getEventManager();
    const cb = vi.fn();
    manager.subscribeRun('run_1', cb);

    emitEvent('run_1', makeEvent('RUN_COMPLETED', 'run_1'));
    expect(manager.activeStreamCount).toBe(0);
  });

  it('destroy cleans up all streams', () => {
    const manager = getEventManager();
    manager.subscribeRun('run_1', () => {});
    manager.subscribeRun('run_2', () => {});
    expect(manager.activeStreamCount).toBe(2);

    destroyEventManager();
    // New manager should start fresh
    const fresh = getEventManager();
    expect(fresh.activeStreamCount).toBe(0);
  });
});
