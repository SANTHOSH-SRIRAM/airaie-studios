import type { RunEvent } from '../types/events';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

export function createRunStream(
  runId: string,
  onEvent: (event: RunEvent) => void,
  onError?: (error: Event) => void
): () => void {
  let retries = 0;
  let es: EventSource | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    es = new EventSource(`/v0/runs/${runId}/stream`);

    es.onmessage = (msg) => {
      retries = 0;
      try {
        const event: RunEvent = JSON.parse(msg.data);
        onEvent(event);

        // Auto-close on terminal events
        if (
          event.event_type === 'RUN_COMPLETED' ||
          event.event_type === 'RUN_FAILED' ||
          event.event_type === 'RUN_CANCELED'
        ) {
          cleanup();
        }
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = (err) => {
      es?.close();
      if (closed) return;

      if (retries < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * 2 ** retries, MAX_DELAY);
        retries++;
        setTimeout(connect, delay);
      } else {
        onError?.(err);
      }
    };
  }

  function cleanup() {
    closed = true;
    es?.close();
    es = null;
  }

  connect();
  return cleanup;
}
