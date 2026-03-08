import { describe, it, expect } from 'vitest';
import {
  CreateWorkflowSchema,
  StartRunSchema,
  CreateAgentSchema,
  CreateGateSchema,
  GateApprovalSchema,
  CreateBoardSchema,
  CreateBoardRecordSchema,
} from '../schemas/requests';

describe('Zod request schemas', () => {
  describe('CreateWorkflowSchema', () => {
    it('accepts valid input', () => {
      const result = CreateWorkflowSchema.safeParse({ name: 'My Workflow', description: 'Test' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = CreateWorkflowSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('StartRunSchema', () => {
    it('accepts tool_ref', () => {
      const result = StartRunSchema.safeParse({ tool_ref: 'test@1.0', inputs: {} });
      expect(result.success).toBe(true);
    });

    it('accepts workflow_id', () => {
      const result = StartRunSchema.safeParse({ workflow_id: 'wf_123', version: 1, inputs: {} });
      expect(result.success).toBe(true);
    });

    it('rejects missing both tool_ref and workflow_id', () => {
      const result = StartRunSchema.safeParse({ inputs: {} });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateAgentSchema', () => {
    it('accepts valid input', () => {
      const result = CreateAgentSchema.safeParse({ name: 'Test Agent' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = CreateAgentSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateGateSchema', () => {
    it('accepts valid input', () => {
      const result = CreateGateSchema.safeParse({
        board_id: 'brd_1',
        name: 'Review Gate',
        gate_type: 'review',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid gate_type', () => {
      const result = CreateGateSchema.safeParse({
        board_id: 'brd_1',
        name: 'Bad Gate',
        gate_type: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GateApprovalSchema', () => {
    it('requires rationale', () => {
      const result = GateApprovalSchema.safeParse({ rationale: '' });
      expect(result.success).toBe(false);
    });

    it('accepts valid rationale', () => {
      const result = GateApprovalSchema.safeParse({ rationale: 'Looks good' });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBoardSchema', () => {
    it('accepts valid input', () => {
      const result = CreateBoardSchema.safeParse({ name: 'Test Board', type: 'engineering' });
      expect(result.success).toBe(true);
    });
  });

  describe('CreateBoardRecordSchema', () => {
    it('accepts valid record', () => {
      const result = CreateBoardRecordSchema.safeParse({
        record_type: 'hypothesis',
        title: 'Test Hypothesis',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid record_type', () => {
      const result = CreateBoardRecordSchema.safeParse({
        record_type: 'invalid_type',
        title: 'Bad',
      });
      expect(result.success).toBe(false);
    });
  });
});
