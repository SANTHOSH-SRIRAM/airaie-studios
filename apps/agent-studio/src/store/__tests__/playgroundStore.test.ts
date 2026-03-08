import { describe, it, expect, beforeEach } from 'vitest';
import { usePlaygroundStore } from '../playgroundStore';
import type { ChatMessage } from '../playgroundStore';

const makeMessage = (id: string, role: ChatMessage['role'] = 'user'): ChatMessage => ({
  id,
  role,
  content: `Message ${id}`,
  timestamp: new Date().toISOString(),
});

describe('playgroundStore', () => {
  beforeEach(() => {
    usePlaygroundStore.getState().reset();
  });

  describe('defaults', () => {
    it('starts with no session', () => {
      expect(usePlaygroundStore.getState().activeSessionId).toBeNull();
    });

    it('starts with empty messages', () => {
      expect(usePlaygroundStore.getState().messages).toEqual([]);
    });

    it('starts with dryRun enabled', () => {
      expect(usePlaygroundStore.getState().dryRun).toBe(true);
    });

    it('starts not running', () => {
      expect(usePlaygroundStore.getState().isRunning).toBe(false);
    });
  });

  describe('messages', () => {
    it('adds messages in order', () => {
      const s = usePlaygroundStore.getState();
      s.addMessage(makeMessage('m1', 'user'));
      s.addMessage(makeMessage('m2', 'agent'));
      const msgs = usePlaygroundStore.getState().messages;
      expect(msgs).toHaveLength(2);
      expect(msgs[0].id).toBe('m1');
      expect(msgs[1].role).toBe('agent');
    });

    it('clears messages', () => {
      usePlaygroundStore.getState().addMessage(makeMessage('m1'));
      usePlaygroundStore.getState().clearMessages();
      expect(usePlaygroundStore.getState().messages).toEqual([]);
    });
  });

  describe('proposals', () => {
    it('adds and clears proposals', () => {
      const proposal = { id: 'p1', tool_name: 'search', arguments: {}, status: 'pending' };
      usePlaygroundStore.getState().addProposal(proposal as any);
      expect(usePlaygroundStore.getState().proposals).toHaveLength(1);

      usePlaygroundStore.getState().clearProposals();
      expect(usePlaygroundStore.getState().proposals).toEqual([]);
    });
  });

  describe('dryRun', () => {
    it('toggles dry run mode', () => {
      usePlaygroundStore.getState().setDryRun(false);
      expect(usePlaygroundStore.getState().dryRun).toBe(false);
    });
  });

  describe('running state', () => {
    it('sets running state', () => {
      usePlaygroundStore.getState().setRunning(true);
      expect(usePlaygroundStore.getState().isRunning).toBe(true);
    });

    it('sets active run ID', () => {
      usePlaygroundStore.getState().setActiveRunId('run_123');
      expect(usePlaygroundStore.getState().activeRunId).toBe('run_123');
    });
  });

  describe('session', () => {
    it('sets active session', () => {
      usePlaygroundStore.getState().setActiveSession('sess_1');
      expect(usePlaygroundStore.getState().activeSessionId).toBe('sess_1');
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      const s = usePlaygroundStore.getState();
      s.setActiveSession('sess_1');
      s.addMessage(makeMessage('m1'));
      s.setDryRun(false);
      s.setRunning(true);
      s.setActiveRunId('run_1');
      s.reset();

      const after = usePlaygroundStore.getState();
      expect(after.activeSessionId).toBeNull();
      expect(after.messages).toEqual([]);
      expect(after.dryRun).toBe(true);
      expect(after.isRunning).toBe(false);
      expect(after.activeRunId).toBeNull();
    });
  });
});
