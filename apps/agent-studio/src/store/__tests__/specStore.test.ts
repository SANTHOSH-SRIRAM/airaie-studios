import { describe, it, expect, beforeEach } from 'vitest';
import { useSpecStore } from '../specStore';

describe('specStore', () => {
  beforeEach(() => {
    useSpecStore.getState().reset();
  });

  describe('defaults', () => {
    it('starts with empty goal', () => {
      expect(useSpecStore.getState().goal).toBe('');
    });

    it('starts with empty tools', () => {
      expect(useSpecStore.getState().tools).toEqual([]);
    });

    it('starts with default constraints', () => {
      const c = useSpecStore.getState().constraints;
      expect(c.max_tools_per_run).toBe(10);
      expect(c.timeout_seconds).toBe(300);
      expect(c.max_retries).toBe(3);
    });

    it('starts with default policy', () => {
      expect(useSpecStore.getState().policy.auto_approve_threshold).toBe(0.85);
    });

    it('starts not dirty', () => {
      expect(useSpecStore.getState().isDirty).toBe(false);
    });
  });

  describe('setGoal', () => {
    it('sets goal and marks dirty', () => {
      useSpecStore.getState().setGoal('Analyze data');
      expect(useSpecStore.getState().goal).toBe('Analyze data');
      expect(useSpecStore.getState().isDirty).toBe(true);
    });
  });

  describe('tools', () => {
    const tool = { tool_ref: 'tool_search', permissions: ['read'] };

    it('adds a tool', () => {
      useSpecStore.getState().addTool(tool as any);
      expect(useSpecStore.getState().tools).toHaveLength(1);
      expect(useSpecStore.getState().isDirty).toBe(true);
    });

    it('removes a tool by ref', () => {
      useSpecStore.getState().addTool(tool as any);
      useSpecStore.getState().removeTool('tool_search');
      expect(useSpecStore.getState().tools).toHaveLength(0);
    });

    it('setTools replaces all tools', () => {
      useSpecStore.getState().addTool(tool as any);
      useSpecStore.getState().setTools([]);
      expect(useSpecStore.getState().tools).toEqual([]);
    });
  });

  describe('setSpec', () => {
    it('hydrates store from a spec object', () => {
      useSpecStore.getState().setSpec({
        goal: 'Test goal',
        tools: [{ tool_ref: 't1', permissions: [] }],
        constraints: { max_tools_per_run: 5, timeout_seconds: 60, max_retries: 1 },
        metadata: { domain_tags: ['science'] },
      });

      const s = useSpecStore.getState();
      expect(s.goal).toBe('Test goal');
      expect(s.tools).toHaveLength(1);
      expect(s.constraints.max_tools_per_run).toBe(5);
      expect(s.domainTags).toEqual(['science']);
      expect(s.isDirty).toBe(false);
    });

    it('uses defaults for missing fields', () => {
      useSpecStore.getState().setSpec({});
      const s = useSpecStore.getState();
      expect(s.goal).toBe('');
      expect(s.tools).toEqual([]);
      expect(s.constraints.max_tools_per_run).toBe(10);
    });
  });

  describe('buildSpec', () => {
    it('builds a complete AgentSpec object', () => {
      useSpecStore.getState().setAgentName('ImageAgent');
      useSpecStore.getState().setGoal('Classify images');
      useSpecStore.getState().setDomainTags(['vision', 'ml']);

      const spec = useSpecStore.getState().buildSpec('v1', 'user1');
      expect(spec.api_version).toBe('v1');
      expect(spec.kind).toBe('AgentSpec');
      expect(spec.metadata.name).toBe('ImageAgent');
      expect(spec.metadata.owner).toBe('user1');
      expect(spec.metadata.domain_tags).toEqual(['vision', 'ml']);
      expect(spec.goal).toBe('Classify images');
    });

    it('excludes denied_capabilities when empty', () => {
      const spec = useSpecStore.getState().buildSpec('v1', 'o');
      expect(spec).not.toHaveProperty('denied_capabilities');
    });

    it('includes denied_capabilities when set', () => {
      useSpecStore.getState().setDeniedCapabilities(['file_write', 'network']);
      const spec = useSpecStore.getState().buildSpec('v1', 'o');
      expect((spec as unknown as Record<string, unknown>).denied_capabilities).toEqual(['file_write', 'network']);
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      useSpecStore.getState().setGoal('test');
      useSpecStore.getState().addTool({ tool_ref: 't', permissions: [] } as any);
      useSpecStore.getState().setDomainTags(['tag']);
      useSpecStore.getState().reset();

      const s = useSpecStore.getState();
      expect(s.goal).toBe('');
      expect(s.tools).toEqual([]);
      expect(s.domainTags).toEqual([]);
      expect(s.isDirty).toBe(false);
    });
  });
});
