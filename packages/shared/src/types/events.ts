// =============================================================
// Run Event types — from event.schema.json
// =============================================================

export type RunEventType =
  | 'RUN_CREATED'
  | 'RUN_STARTED'
  | 'RUN_COMPLETED'
  | 'RUN_FAILED'
  | 'RUN_CANCELED'
  | 'NODE_QUEUED'
  | 'NODE_STARTED'
  | 'NODE_LOG'
  | 'NODE_PROGRESS'
  | 'NODE_COMPLETED'
  | 'NODE_FAILED'
  | 'NODE_RETRYING';

export interface RunEvent {
  event_id: string;
  event_type: RunEventType;
  timestamp: string;
  run_id: string;
  node_id?: string;
  job_id?: string;
  payload: Record<string, unknown>;
}
