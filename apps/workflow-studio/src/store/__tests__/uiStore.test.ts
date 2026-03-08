import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('workflow uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeBoard: 'builder',
      sidebarCollapsed: false,
      workflowId: '',
      workflowName: '',
    });
  });

  describe('defaults', () => {
    it('starts with builder board', () => {
      expect(useUIStore.getState().activeBoard).toBe('builder');
    });

    it('starts with sidebar expanded', () => {
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setActiveBoard', () => {
    it('changes active board', () => {
      useUIStore.getState().setActiveBoard('runs');
      expect(useUIStore.getState().activeBoard).toBe('runs');
    });
  });

  describe('toggleSidebar', () => {
    it('toggles sidebar collapsed state', () => {
      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);

      useUIStore.getState().toggleSidebar();
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('setWorkflow', () => {
    it('sets workflow id and name', () => {
      useUIStore.getState().setWorkflow('wf_abc', 'My Workflow');
      const s = useUIStore.getState();
      expect(s.workflowId).toBe('wf_abc');
      expect(s.workflowName).toBe('My Workflow');
    });
  });
});
