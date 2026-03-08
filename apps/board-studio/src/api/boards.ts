// ============================================================
// Board API functions — wraps axios calls with KERNEL_ENDPOINTS
// ============================================================

import apiClient from './client';
import { KERNEL_ENDPOINTS } from '@/constants/api';
import type {
  Board,
  BoardSummary,
  BoardTemplate,
  IntentType,
  Vertical,
  BoardListParams,
  BackendBoardSummary,
  EvidenceDiff,
  TriageResult,
  ReproducibilityScore,
} from '@/types/board';

// ------------------------------------------------------------
// Transformers
// ------------------------------------------------------------

/** Transform backend BoardSummary shape to frontend BoardSummary */
function transformBoardSummary(raw: BackendBoardSummary): BoardSummary {
  const scores = raw.readiness_scores ?? {};

  // Build gate_summary from gate_stats
  // Use per-gate data from backend if available, otherwise synthesize descriptive entries
  const gateSummaryEntries: BoardSummary['gate_summary'] = [];
  if (raw.gates && Array.isArray(raw.gates)) {
    for (const gate of raw.gates) {
      gateSummaryEntries.push({
        name: gate.name ?? `${gate.type ?? 'Gate'} (${(gate.status ?? 'unknown').toLowerCase()})`,
        type: (gate.type ?? 'evidence') as BoardSummary['gate_summary'][number]['type'],
        status: (gate.status ?? 'PENDING') as BoardSummary['gate_summary'][number]['status'],
      });
    }
  } else {
    for (let i = 0; i < (raw.gate_stats.passed ?? 0); i++) {
      gateSummaryEntries.push({ name: `Evidence gate (passed)`, type: 'evidence', status: 'PASSED' });
    }
    for (let i = 0; i < (raw.gate_stats.pending ?? 0); i++) {
      gateSummaryEntries.push({ name: `Review gate (pending)`, type: 'review', status: 'PENDING' });
    }
    for (let i = 0; i < (raw.gate_stats.failed ?? 0); i++) {
      gateSummaryEntries.push({ name: `Evidence gate (failed)`, type: 'evidence', status: 'FAILED' });
    }
  }

  return {
    overall_readiness: raw.overall_readiness,
    readiness: {
      design: scores.design ?? 0,
      validation: scores.validation ?? 0,
      compliance: scores.compliance ?? 0,
      manufacturing: scores.manufacturing ?? 0,
      approvals: scores.approvals ?? 0,
    },
    card_progress: {
      completed: raw.card_stats.completed ?? 0,
      total: raw.card_stats.total ?? 0,
    },
    card_status_breakdown: {
      draft: raw.card_stats.draft ?? 0,
      ready: raw.card_stats.ready ?? 0,
      queued: raw.card_stats.queued ?? 0,
      running: raw.card_stats.running ?? 0,
      completed: raw.card_stats.completed ?? 0,
      failed: raw.card_stats.failed ?? 0,
      blocked: raw.card_stats.blocked ?? 0,
      skipped: raw.card_stats.skipped ?? 0,
    },
    gate_count: raw.gate_stats.total ?? 0,
    gate_summary: gateSummaryEntries,
  };
}

// ------------------------------------------------------------
// Boards
// ------------------------------------------------------------

export async function fetchBoards(params?: BoardListParams): Promise<Board[]> {
  const { data } = await apiClient.get<{ boards: Board[] }>(KERNEL_ENDPOINTS.BOARDS.LIST, { params });
  return data.boards ?? [];
}

export async function fetchBoard(id: string): Promise<Board> {
  const { data } = await apiClient.get<Board>(KERNEL_ENDPOINTS.BOARDS.GET(id));
  // Ensure vertical_id is populated — derive from type prefix if backend doesn't set it
  if (!data.vertical_id && data.type) {
    const typeLower = data.type.toLowerCase();
    const prefixMap: Record<string, string> = {
      engineering: 'engineering',
      mechanical: 'engineering',
      electrical: 'engineering',
      science: 'science',
      lab: 'science',
      research: 'science',
      technology: 'technology',
      mlops: 'technology',
      software: 'technology',
      math: 'mathematics',
      mathematics: 'mathematics',
      optimization: 'mathematics',
      statistics: 'mathematics',
    };
    for (const [prefix, slug] of Object.entries(prefixMap)) {
      if (typeLower.includes(prefix)) {
        data.vertical_id = slug;
        break;
      }
    }
  }
  return data;
}

export async function fetchBoardSummary(id: string): Promise<BoardSummary> {
  const { data } = await apiClient.get<BackendBoardSummary>(KERNEL_ENDPOINTS.BOARDS.SUMMARY(id));
  return transformBoardSummary(data);
}

export async function fetchBoardChildren(id: string): Promise<Board[]> {
  const { data } = await apiClient.get<{ boards: Board[] }>(KERNEL_ENDPOINTS.BOARDS.CHILDREN(id));
  return data.boards ?? [];
}

export async function createBoardFromIntent(payload: {
  name: string;
  description?: string;
  project_id?: string;
  owner?: string;
  parent_board_id?: string;
  intent_spec: {
    intent_type: string;
    goal: string;
    inputs?: unknown[];
    constraints?: Record<string, unknown>;
    acceptance_criteria?: unknown[];
    preferences?: Record<string, unknown>;
    governance?: {
      level: string;
      approval_roles?: string[];
      compliance_tags?: string[];
    };
  };
}): Promise<Board> {
  const { data } = await apiClient.post<{ board: Board }>(KERNEL_ENDPOINTS.BOARDS.FROM_INTENT, payload);
  return data.board;
}

export async function createBoardFromTemplate(payload: {
  template_slug: string;
  name?: string;
  owner: string;
  project_id?: string;
  parent_board_id?: string;
  parameters?: Record<string, unknown>;
}): Promise<Board> {
  const { data } = await apiClient.post<{ board: Board }>(KERNEL_ENDPOINTS.BOARDS.FROM_TEMPLATE, payload);
  return data.board;
}

export async function updateBoard(
  id: string,
  payload: Partial<Pick<Board, 'name' | 'description' | 'status'>>
): Promise<Board> {
  const { data } = await apiClient.patch<Board>(KERNEL_ENDPOINTS.BOARDS.UPDATE(id), payload);
  return data;
}

export async function deleteBoard(id: string): Promise<void> {
  await apiClient.delete(KERNEL_ENDPOINTS.BOARDS.DELETE(id));
}

export async function escalateBoard(id: string, targetMode: string): Promise<Board> {
  const { data } = await apiClient.post<Board>(KERNEL_ENDPOINTS.BOARDS.ESCALATE(id), {
    target_mode: targetMode,
  });
  return data;
}

// ------------------------------------------------------------
// Board Templates
// ------------------------------------------------------------

export async function fetchBoardTemplates(): Promise<BoardTemplate[]> {
  const { data } = await apiClient.get<{ templates: BoardTemplate[] }>(
    KERNEL_ENDPOINTS.BOARD_TEMPLATES.LIST
  );
  return data.templates ?? [];
}

export async function fetchBoardTemplate(slug: string): Promise<BoardTemplate> {
  const { data } = await apiClient.get<BoardTemplate>(KERNEL_ENDPOINTS.BOARD_TEMPLATES.GET(slug));
  return data;
}

// ------------------------------------------------------------
// Verticals
// ------------------------------------------------------------

export async function fetchVerticals(): Promise<Vertical[]> {
  const { data } = await apiClient.get<{ verticals: Vertical[] }>(
    KERNEL_ENDPOINTS.VERTICALS.LIST
  );
  return data.verticals ?? [];
}

// ------------------------------------------------------------
// Intent Types
// ------------------------------------------------------------

export async function fetchIntentTypes(verticalSlug: string): Promise<IntentType[]> {
  const { data } = await apiClient.get<{ intent_types: IntentType[] }>(
    KERNEL_ENDPOINTS.INTENT_TYPES.BY_VERTICAL(verticalSlug)
  );
  return data.intent_types ?? [];
}

// ------------------------------------------------------------
// Intelligence APIs (evidence-diff, triage, reproducibility)
// ------------------------------------------------------------

export async function fetchEvidenceDiff(
  boardId: string,
  baselineBoardId?: string
): Promise<EvidenceDiff[]> {
  const { data } = await apiClient.get<{ diffs: EvidenceDiff[] }>(
    KERNEL_ENDPOINTS.BOARDS.EVIDENCE_DIFF(boardId),
    { params: { baseline_board_id: baselineBoardId ?? boardId } }
  );
  return data.diffs ?? [];
}

export async function fetchTriage(boardId: string): Promise<TriageResult> {
  const { data } = await apiClient.get<TriageResult>(
    KERNEL_ENDPOINTS.BOARDS.TRIAGE(boardId)
  );
  return data;
}

export async function fetchReproducibility(boardId: string): Promise<ReproducibilityScore> {
  const { data } = await apiClient.get<ReproducibilityScore>(
    KERNEL_ENDPOINTS.BOARDS.REPRODUCIBILITY(boardId)
  );
  return data;
}
