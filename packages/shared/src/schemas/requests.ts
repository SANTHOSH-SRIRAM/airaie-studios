// =============================================================
// Zod validation schemas for kernel API request bodies
// =============================================================

import { z } from 'zod';

// --- Workflow ---

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
});

export const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const CompileWorkflowSchema = z.object({
  dsl: z.string().min(1, 'DSL is required'),
});

export const ValidateWorkflowSchema = z.object({
  dsl: z.string().min(1, 'DSL is required'),
});

// --- Run ---

export const StartRunSchema = z.object({
  tool_ref: z.string().optional(),
  workflow_id: z.string().optional(),
  version: z.number().int().positive().optional(),
  inputs: z.record(z.unknown()).default({}),
}).refine(
  (data) => data.tool_ref || data.workflow_id,
  { message: 'Either tool_ref or workflow_id is required' }
);

export const CancelRunSchema = z.object({
  reason: z.string().max(500).optional(),
});

// --- Agent ---

export const CreateAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
});

export const UpdateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const CreateAgentVersionSchema = z.object({
  spec: z.object({
    api_version: z.string().default('v1'),
    kind: z.literal('AgentSpec').default('AgentSpec'),
    metadata: z.object({
      name: z.string().min(1),
      version: z.string().min(1),
      owner: z.string().min(1),
      domain_tags: z.array(z.string()).default([]),
    }),
    goal: z.string().min(1, 'Goal is required'),
    tools: z.array(z.object({
      tool_ref: z.string().min(1),
      permissions: z.object({
        read: z.boolean().default(true),
        write: z.boolean().default(false),
        execute: z.boolean().default(true),
      }),
      max_invocations: z.number().int().positive().default(10),
      required_capabilities: z.array(z.string()).default([]),
    })).default([]),
    context_schema: z.object({
      required_inputs: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        description: z.string(),
      })).default([]),
      optional_inputs: z.array(z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
        description: z.string(),
      })).default([]),
    }).default({ required_inputs: [], optional_inputs: [] }),
    scoring: z.object({
      strategy: z.enum(['weighted', 'priority', 'cost_optimized']).default('weighted'),
      weights: z.object({
        compatibility: z.number().min(0).max(1).default(0.4),
        trust: z.number().min(0).max(1).default(0.3),
        cost: z.number().min(0).max(1).default(0.3),
      }),
    }).default({ strategy: 'weighted', weights: { compatibility: 0.4, trust: 0.3, cost: 0.3 } }),
    constraints: z.object({
      max_tools_per_run: z.number().int().positive().default(5),
      timeout_seconds: z.number().int().positive().default(300),
      max_retries: z.number().int().min(0).default(2),
      budget_limit: z.number().min(0).default(10),
    }).default({ max_tools_per_run: 5, timeout_seconds: 300, max_retries: 2, budget_limit: 10 }),
    policy: z.object({
      auto_approve_threshold: z.number().min(0).max(1).default(0.8),
      require_approval_for: z.array(z.string()).default([]),
      escalation_rules: z.array(z.object({
        condition: z.string(),
        action: z.enum(['require_human_approval', 'block']),
      })).default([]),
    }).default({ auto_approve_threshold: 0.8, require_approval_for: [], escalation_rules: [] }),
  }),
});

// --- Gate ---

export const CreateGateSchema = z.object({
  board_id: z.string().min(1),
  name: z.string().min(1, 'Name is required').max(200),
  gate_type: z.enum(['evidence', 'review', 'compliance']),
  description: z.string().max(2000).optional(),
});

export const GateApprovalSchema = z.object({
  rationale: z.string().min(1, 'Rationale is required').max(2000),
  role: z.string().optional(),
});

// --- Board ---

export const CreateBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.string().min(1),
  description: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UpdateBoardSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// --- Trigger ---

export const CreateTriggerSchema = z.discriminatedUnion('trigger_type', [
  z.object({
    trigger_type: z.literal('cron'),
    name: z.string().min(1).max(200),
    config: z.object({
      type: z.literal('cron'),
      schedule: z.string().min(1, 'Cron schedule is required'),
      timezone: z.string().optional(),
      inputs: z.record(z.unknown()).optional(),
    }),
  }),
  z.object({
    trigger_type: z.literal('webhook'),
    name: z.string().min(1).max(200),
    config: z.object({
      type: z.literal('webhook'),
      secret: z.string().optional(),
      allowed_ips: z.array(z.string()).optional(),
    }),
  }),
  z.object({
    trigger_type: z.literal('event'),
    name: z.string().min(1).max(200),
    config: z.object({
      type: z.literal('event'),
      event_type: z.string().min(1),
      filter: z.record(z.unknown()).optional(),
      inputs_mapping: z.record(z.string()).optional(),
    }),
  }),
]);

// --- Board Record ---

export const CreateBoardRecordSchema = z.object({
  record_type: z.enum([
    'hypothesis', 'claim', 'protocol_step', 'run_reference', 'note',
    'engineering_change', 'acceptance_criteria', 'validation_result',
    'decision', 'requirement',
  ]),
  title: z.string().min(1).max(500),
  content: z.record(z.unknown()).default({}),
  run_id: z.string().optional(),
  artifact_id: z.string().optional(),
});

// --- Inferred types ---

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowSchema>;
export type StartRunInput = z.infer<typeof StartRunSchema>;
export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;
export type CreateAgentVersionInput = z.infer<typeof CreateAgentVersionSchema>;
export type CreateGateInput = z.infer<typeof CreateGateSchema>;
export type GateApprovalInput = z.infer<typeof GateApprovalSchema>;
export type CreateBoardInput = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardInput = z.infer<typeof UpdateBoardSchema>;
export type CreateTriggerInput = z.infer<typeof CreateTriggerSchema>;
export type CreateBoardRecordInput = z.infer<typeof CreateBoardRecordSchema>;
