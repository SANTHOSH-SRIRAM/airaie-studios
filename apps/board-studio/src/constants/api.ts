// ============================================================
// Board-studio kernel endpoint constants
// ============================================================

export const KERNEL_ENDPOINTS = {
  BOARDS: {
    LIST: '/boards',
    GET: (id: string) => `/boards/${id}`,
    CREATE: '/boards',
    UPDATE: (id: string) => `/boards/${id}`,
    DELETE: (id: string) => `/boards/${id}`,
    SUMMARY: (id: string) => `/boards/${id}/summary`,
    CHILDREN: (id: string) => `/boards/${id}/children`,
    FROM_INTENT: '/boards/from-intent',
    FROM_TEMPLATE: '/boards/from-template',
    ESCALATE: (id: string) => `/boards/${id}/escalate`,
    RECORDS: (id: string) => `/boards/${id}/records`,
    ATTACHMENTS: (id: string) => `/boards/${id}/attachments`,
    MODE_CONFIG: (id: string) => `/boards/${id}/mode-config`,
    EVIDENCE_DIFF: (id: string) => `/boards/${id}/evidence-diff`,
    TRIAGE: (id: string) => `/boards/${id}/triage`,
    REPRODUCIBILITY: (id: string) => `/boards/${id}/reproducibility`,
    EXPORT: (id: string) => `/boards/${id}/export`,
  },

  CARDS: {
    LIST: (boardId: string) => `/boards/${boardId}/cards`,
    CREATE: (boardId: string) => `/boards/${boardId}/cards`,
    READY: (boardId: string) => `/boards/${boardId}/cards/ready`,
    GRAPH: (boardId: string) => `/boards/${boardId}/cards/graph`,
    GET: (id: string) => `/cards/${id}`,
    UPDATE: (id: string) => `/cards/${id}`,
    DELETE: (id: string) => `/cards/${id}`,
    EVIDENCE: (id: string) => `/cards/${id}/evidence`,
    RUNS: (id: string) => `/cards/${id}/runs`,
    ADD_DEPENDENCY: (id: string, depId: string) => `/cards/${id}/dependencies/${depId}`,
    REMOVE_DEPENDENCY: (id: string, depId: string) => `/cards/${id}/dependencies/${depId}`,
  },

  PLANS: {
    GET: (cardId: string) => `/cards/${cardId}/plan`,
    GENERATE: (cardId: string) => `/cards/${cardId}/plan/generate`,
    EDIT: (cardId: string) => `/cards/${cardId}/plan`,
    COMPILE: (cardId: string) => `/cards/${cardId}/plan/compile`,
    VALIDATE: (cardId: string) => `/cards/${cardId}/plan/validate`,
    EXECUTE: (cardId: string) => `/cards/${cardId}/plan/execute`,
  },

  TOOLSHELF: {
    RESOLVE: '/toolshelf/resolve/v2',
    TOOL_DETAIL: (id: string) => `/toolshelf/tools/${id}`,
  },

  BOARD_TEMPLATES: {
    LIST: '/board-templates',
    GET: (slug: string) => `/board-templates/${slug}`,
  },

  VERTICALS: {
    LIST: '/verticals',
  },

  INTENTS: {
    LIST: (boardId: string) => `/boards/${boardId}/intents`,
    CREATE: (boardId: string) => `/boards/${boardId}/intents`,
    GET: (id: string) => `/intents/${id}`,
    UPDATE: (id: string) => `/intents/${id}`,
  },

  INTENT_TYPES: {
    BY_VERTICAL: (slug: string) => `/verticals/${slug}/intent-types`,
    GET: (slug: string) => `/intent-types/${slug}`,
    INPUTS: (slug: string) => `/intent-types/${slug}/inputs`,
  },

  GATES: {
    LIST: '/gates',
    GET: (id: string) => `/gates/${id}`,
    REQUIREMENTS: (id: string) => `/gates/${id}/requirements`,
    EVALUATE: (id: string) => `/gates/${id}/evaluate`,
    APPROVE: (id: string) => `/gates/${id}/approve`,
    REJECT: (id: string) => `/gates/${id}/reject`,
    WAIVE: (id: string) => `/gates/${id}/waive`,
  },
  RUNS: {
    LIST: '/runs',
    GET: (id: string) => `/runs/${id}`,
    TRACES: (runId: string) => `/runs/${runId}/traces`,
  },

  AGENTS: {
    LIST: '/agents',
    MEMORIES: (agentId: string) => `/agents/${agentId}/memories`,
    MEMORY: (agentId: string, memoryId: string) =>
      `/agents/${agentId}/memories/${memoryId}`,
  },

  ARTIFACTS: {
    LINEAGE: (id: string) => `/artifacts/${id}/lineage`,
  },
} as const;
