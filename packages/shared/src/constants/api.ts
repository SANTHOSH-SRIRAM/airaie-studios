export const ENDPOINTS = {
  WORKFLOWS: {
    LIST: '/workflows',
    GET: (id: string) => `/workflows/${id}`,
    CREATE: '/workflows',
    DELETE: (id: string) => `/workflows/${id}`,
    VERSIONS: (id: string) => `/workflows/${id}/versions`,
    VERSION: (id: string, v: number) => `/workflows/${id}/versions/${v}`,
    PUBLISH: (id: string, v: number) => `/workflows/${id}/versions/${v}/publish`,
    COMPILE: '/workflows/compile',
    VALIDATE: '/workflows/validate',
    PLAN: '/workflows/plan',
  },

  RUNS: {
    LIST: '/runs',
    GET: (id: string) => `/runs/${id}`,
    START: '/runs',
    CANCEL: (id: string) => `/runs/${id}/cancel`,
    RESUME: (id: string) => `/runs/${id}/resume`,
    LOGS: (id: string) => `/runs/${id}/logs`,
    EVENTS: (id: string) => `/runs/${id}/events`,
    ARTIFACTS: (id: string) => `/runs/${id}/artifacts`,
    STREAM: (id: string) => `/runs/${id}/stream`,
  },

  ARTIFACTS: {
    LIST: '/artifacts',
    GET: (id: string) => `/artifacts/${id}`,
    UPLOAD_URL: '/artifacts/upload-url',
    FINALIZE: (id: string) => `/artifacts/${id}/finalize`,
    DOWNLOAD_URL: (id: string) => `/artifacts/${id}/download-url`,
    LINEAGE: (id: string) => `/artifacts/${id}/lineage`,
  },

  AGENTS: {
    LIST: '/agents',
    GET: (id: string) => `/agents/${id}`,
    CREATE: '/agents',
    DELETE: (id: string) => `/agents/${id}`,
    VERSIONS: (id: string) => `/agents/${id}/versions`,
    VERSION: (id: string, v: number) => `/agents/${id}/versions/${v}`,
    VALIDATE: (id: string, v: number) => `/agents/${id}/versions/${v}/validate`,
    PUBLISH: (id: string, v: number) => `/agents/${id}/versions/${v}/publish`,
    RUN: (id: string, v: number) => `/agents/${id}/versions/${v}/run`,
    SESSIONS: (id: string) => `/agents/${id}/sessions`,
    SESSION: (id: string, sid: string) => `/agents/${id}/sessions/${sid}`,
    SESSION_RUN: (id: string, sid: string) => `/agents/${id}/sessions/${sid}/run`,
    SESSION_CLOSE: (id: string, sid: string) => `/agents/${id}/sessions/${sid}/close`,
    SESSION_MESSAGES: (id: string, sid: string) => `/agents/${id}/sessions/${sid}/messages`,
    SESSION_APPROVE: (id: string, sid: string) => `/agents/${id}/sessions/${sid}/approve`,
    MEMORIES: (id: string) => `/agents/${id}/memories`,
    MEMORY: (id: string, mid: string) => `/agents/${id}/memories/${mid}`,
  },

  GATES: {
    LIST: '/gates',
    GET: (id: string) => `/gates/${id}`,
    CREATE: '/gates',
    REQUIREMENTS: (id: string) => `/gates/${id}/requirements`,
    EVALUATE: (id: string) => `/gates/${id}/evaluate`,
    APPROVE: (id: string) => `/gates/${id}/approve`,
    REJECT: (id: string) => `/gates/${id}/reject`,
    WAIVE: (id: string) => `/gates/${id}/waive`,
    APPROVALS: (id: string) => `/gates/${id}/approvals`,
  },

  TOOLS: {
    LIST: '/tools',
    GET: (id: string) => `/tools/${id}`,
    CREATE: '/tools',
    DELETE: (id: string) => `/tools/${id}`,
    VERSIONS: (id: string) => `/tools/${id}/versions`,
    VERSION: (id: string, v: string) => `/tools/${id}/versions/${v}`,
  },

  BOARDS: {
    LIST: '/boards',
    GET: (id: string) => `/boards/${id}`,
    CREATE: '/boards',
    UPDATE: (id: string) => `/boards/${id}`,
    DELETE: (id: string) => `/boards/${id}`,
    RECORDS: (id: string) => `/boards/${id}/records`,
    RECORD: (id: string, rid: string) => `/boards/${id}/records/${rid}`,
    ATTACHMENTS: (id: string) => `/boards/${id}/attachments`,
    GATES: (id: string) => `/boards/${id}/gates`,
  },

  PROJECTS: {
    LIST: '/projects',
    GET: (id: string) => `/projects/${id}`,
    CREATE: '/projects',
    UPDATE: (id: string) => `/projects/${id}`,
    MEMBERS: (id: string) => `/projects/${id}/members`,
  },

  AUDIT: {
    LIST: '/audit',
    GET: (id: string) => `/audit/${id}`,
  },

  APPROVALS: {
    LIST: '/approvals',
    GET: (id: string) => `/approvals/${id}`,
    APPROVE: (id: string) => `/approvals/${id}/approve`,
    REJECT: (id: string) => `/approvals/${id}/reject`,
  },
} as const;
