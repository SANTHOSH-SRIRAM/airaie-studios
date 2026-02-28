// ============================================================
// Board-studio kernel endpoint constants
// ============================================================

export const KERNEL_ENDPOINTS = {
  BOARDS: {
    LIST: '/v0/boards',
    GET: (id: string) => `/v0/boards/${id}`,
    CREATE: '/v0/boards',
    UPDATE: (id: string) => `/v0/boards/${id}`,
    DELETE: (id: string) => `/v0/boards/${id}`,
    SUMMARY: (id: string) => `/v0/boards/${id}/summary`,
    CHILDREN: (id: string) => `/v0/boards/${id}/children`,
    FROM_INTENT: '/v0/boards/from-intent',
    FROM_TEMPLATE: '/v0/boards/from-template',
    ESCALATE: (id: string) => `/v0/boards/${id}/escalate`,
    EVIDENCE_DIFF: (id: string) => `/v0/boards/${id}/evidence-diff`,
    TRIAGE: (id: string) => `/v0/boards/${id}/triage`,
    REPRODUCIBILITY: (id: string) => `/v0/boards/${id}/reproducibility`,
    EXPORT: (id: string) => `/v0/boards/${id}/export`,
  },

  CARDS: {
    LIST: (boardId: string) => `/v0/boards/${boardId}/cards`,
    GRAPH: (boardId: string) => `/v0/boards/${boardId}/cards/graph`,
    GET: (id: string) => `/v0/cards/${id}`,
    UPDATE: (id: string) => `/v0/cards/${id}`,
    EVIDENCE: (id: string) => `/v0/cards/${id}/evidence`,
    RUNS: (id: string) => `/v0/cards/${id}/runs`,
  },

  PLANS: {
    GET: (cardId: string) => `/v0/cards/${cardId}/plan`,
    GENERATE: (cardId: string) => `/v0/cards/${cardId}/plan/generate`,
    EDIT: (cardId: string) => `/v0/cards/${cardId}/plan`,
    COMPILE: (cardId: string) => `/v0/cards/${cardId}/plan/compile`,
    VALIDATE: (cardId: string) => `/v0/cards/${cardId}/plan/validate`,
    EXECUTE: (cardId: string) => `/v0/cards/${cardId}/plan/execute`,
  },

  TOOLSHELF: {
    RESOLVE: '/v0/toolshelf/resolve/v2',
    TOOL_DETAIL: (id: string) => `/v0/toolshelf/tools/${id}`,
  },

  BOARD_TEMPLATES: {
    LIST: '/v0/board-templates',
    GET: (slug: string) => `/v0/board-templates/${slug}`,
  },

  INTENT_TYPES: {
    BY_VERTICAL: (slug: string) => `/v0/verticals/${slug}/intent-types`,
    GET: (slug: string) => `/v0/intent-types/${slug}`,
    INPUTS: (slug: string) => `/v0/intent-types/${slug}/inputs`,
  },

  GATES: {
    LIST: (boardId: string) => `/v0/boards/${boardId}/gates`,
    GET: (id: string) => `/v0/gates/${id}`,
    REQUIREMENTS: (id: string) => `/v0/gates/${id}/requirements`,
    EVALUATE: (id: string) => `/v0/gates/${id}/evaluate`,
    APPROVE: (id: string) => `/v0/gates/${id}/approve`,
    REJECT: (id: string) => `/v0/gates/${id}/reject`,
    WAIVE: (id: string) => `/v0/gates/${id}/waive`,
  },
} as const;
