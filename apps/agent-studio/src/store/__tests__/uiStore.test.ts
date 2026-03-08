import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('agent uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ agentId: '' });
  });

  it('has correct initial state', () => {
    const state = useUIStore.getState();
    expect(state.agentId).toBe('');
  });

  it('setAgentId updates agentId', () => {
    useUIStore.getState().setAgentId('agent-123');
    expect(useUIStore.getState().agentId).toBe('agent-123');
  });
});
