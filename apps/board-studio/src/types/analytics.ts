// ============================================================
// Analytics domain types — run comparison, cost, lineage
// ============================================================

/** Delta between KPI values across compared runs */
export interface KPIDelta {
  key: string;
  values: (number | null)[];
  delta: number;
  deltaPercent: number;
  improved: boolean;
}

/** Aggregated comparison data for 2+ runs */
export interface RunComparisonData {
  runIds: string[];
  kpiDeltas: KPIDelta[];
  runLabels: string[];
}

/** Per-tool cost breakdown (for Plan 03) */
export interface CostBreakdown {
  tool: string;
  estimated: number;
  actual: number;
}

/** Lineage graph node (for Plan 02) */
export interface ArtifactLineageNode {
  id: string;
  type: 'input' | 'tool' | 'output';
  name: string;
  hash?: string;
}

/** Lineage graph edge (for Plan 02) */
export interface ArtifactLineageEdge {
  source: string;
  target: string;
  label?: string;
}
