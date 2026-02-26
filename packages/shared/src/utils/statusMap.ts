import type { RunStatus, NodeRunStatus } from '../types/kernel';

/**
 * Maps kernel UPPERCASE RunStatus to UI lowercase status strings
 * accepted by @airaie/ui StatusBadge.
 */
const runStatusMap: Record<RunStatus, string> = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCEEDED: 'completed',
  FAILED: 'failed',
  CANCELED: 'cancelled',
  AWAITING_APPROVAL: 'pending',
};

/**
 * Maps kernel UPPERCASE NodeRunStatus to UI lowercase status strings
 * accepted by @airaie/ui StatusBadge.
 */
const nodeRunStatusMap: Record<NodeRunStatus, string> = {
  QUEUED: 'queued',
  RUNNING: 'running',
  RETRYING: 'running',
  BLOCKED: 'waiting',
  SUCCEEDED: 'success',
  FAILED: 'error',
  SKIPPED: 'skipped',
  CANCELED: 'cancelled',
};

export function toUiRunStatus(status: RunStatus): string {
  return runStatusMap[status] ?? 'pending';
}

export function toUiNodeRunStatus(status: NodeRunStatus): string {
  return nodeRunStatusMap[status] ?? 'idle';
}

/**
 * Calculates elapsed seconds between two timestamps.
 * Returns null if startedAt is not provided.
 */
export function calcElapsedSeconds(startedAt?: string, completedAt?: string): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  return Math.floor((end - start) / 1000);
}
