// ============================================================
// Vertical Registry type definitions
// ============================================================

import type { LucideIcon } from 'lucide-react';

/** Visual theme for a STEM vertical */
export interface VerticalTheme {
  slug: string;
  name: string;
  accentColor: string;      // Tailwind color class e.g. 'blue-600'
  accentBg: string;          // Background variant e.g. 'blue-50'
  accentText: string;        // Text variant e.g. 'blue-700'
  accentBorder: string;      // Border variant e.g. 'blue-200'
  icon: LucideIcon;
  cardFacePreset?: CardFacePreset;
}

/** Card face preset — controls per-vertical card layout personality */
export interface CardFacePreset {
  summaryLayout: 'metrics-row' | 'primary-gauge' | 'sparkline-row' | 'stats-grid';
  primaryMetricKey?: string;
  accentBarStyle: 'solid' | 'gradient' | 'split';
  iconSize: 'sm' | 'md' | 'lg';
}

/** How to format a value */
export type FieldFormat = 'text' | 'number' | 'percentage' | 'duration' | 'boolean' | 'progress';

/** Definition for a card summary/detail field extracted from config/kpis */
export interface CardFieldDefinition {
  key: string;               // Dot-path into card data e.g. 'config.solver' or 'kpis.von_mises_max'
  label: string;
  format: FieldFormat;
  unit?: string;             // e.g. 'MPa', 'mm', '%'
  icon?: LucideIcon;
}

/** Definition for a domain-specific action button */
export interface CardActionDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  condition?: (card: { status: string; config: Record<string, unknown> }) => boolean;
}

/** Execution hints for domain-aware card setup */
export interface ExecutionHints {
  recommendedTools: string[];
  typicalCost: { min: number; max: number; unit: string };
  typicalDuration: { min: string; max: string };
  preflightRules: string[];
  requiredNodeRoles: string[];
}

/** Schema for a single expected evidence metric */
export interface EvidenceMetricSchema {
  key: string;
  label: string;
  unit: string;
  typical_range: { min: number; max: number };
  visualization: 'gauge' | 'bar' | 'sparkline' | 'value';
}

/** Schema for all expected evidence from an intent */
export interface EvidenceSchema {
  expectedMetrics: EvidenceMetricSchema[];
  comparisonMode: 'delta' | 'ratio' | 'absolute';
}

/** Typical gate generated for an intent */
export interface TypicalGate {
  name: string;
  type: 'evidence' | 'review' | 'compliance';
  auto_evaluate: boolean;
}

/** Card configuration for a specific intent type within a vertical */
export interface IntentCardConfig {
  intentTypeSlug: string;
  displayName: string;
  icon: LucideIcon;
  summaryFields: CardFieldDefinition[];
  detailFields: CardFieldDefinition[];
  actions: CardActionDefinition[];
  executionHints?: ExecutionHints;
  evidenceSchema?: EvidenceSchema;
  typicalGates?: TypicalGate[];
}

/** Registry entry for a vertical — theme + intent configs */
export interface VerticalRegistryEntry {
  theme: VerticalTheme;
  intentConfigs: Record<string, IntentCardConfig>;
}

/** The full registry type */
export type VerticalRegistry = Record<string, VerticalRegistryEntry>;
