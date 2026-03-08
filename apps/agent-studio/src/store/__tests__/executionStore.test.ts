import { describe, it, expect, beforeEach } from 'vitest';
import { useExecutionStore } from '../executionStore';

describe('executionStore', () => {
  beforeEach(() => {
    useExecutionStore.getState().clearAll();
  });

  describe('events', () => {
    it('adds events and caps at 1000', () => {
      const store = useExecutionStore.getState();
      for (let i = 0; i < 1005; i++) {
        store.addEvent({ id: `e${i}`, timestamp: new Date().toISOString(), type: 'TEST', nodeId: `n${i}` });
      }
      expect(useExecutionStore.getState().events).toHaveLength(1000);
      expect(useExecutionStore.getState().events[999].id).toBe('e1004');
    });

    it('clears events', () => {
      useExecutionStore.getState().addEvent({ id: 'e1', timestamp: '', type: 'TEST' });
      useExecutionStore.getState().clearEvents();
      expect(useExecutionStore.getState().events).toHaveLength(0);
    });
  });

  describe('problems', () => {
    it('adds and clears problems', () => {
      const store = useExecutionStore.getState();
      store.addProblem({ id: 'p1', severity: 'error', message: 'test', source: 'tsc' });
      store.addProblem({ id: 'p2', severity: 'warning', message: 'warn', source: 'lint' });
      expect(useExecutionStore.getState().problems).toHaveLength(2);
      store.clearProblems();
      expect(useExecutionStore.getState().problems).toHaveLength(0);
    });
  });

  describe('logs', () => {
    it('adds log entries and caps at 5000', () => {
      const store = useExecutionStore.getState();
      for (let i = 0; i < 5005; i++) {
        store.addLog({ id: `l${i}`, timestamp: '', level: 'stdout', source: 'agent', message: `msg${i}` });
      }
      expect(useExecutionStore.getState().logs).toHaveLength(5000);
    });

    it('clears logs', () => {
      useExecutionStore.getState().addLog({ id: 'l1', timestamp: '', level: 'stderr', source: 'test', message: 'err' });
      useExecutionStore.getState().clearLogs();
      expect(useExecutionStore.getState().logs).toHaveLength(0);
    });
  });

  describe('artifacts', () => {
    it('sets and adds artifacts', () => {
      const artifact = { id: 'a1', name: 'report.json', type: 'application/json', size: 1024, createdAt: '', runId: 'r1' };
      useExecutionStore.getState().setArtifacts([artifact]);
      expect(useExecutionStore.getState().artifacts).toHaveLength(1);
      useExecutionStore.getState().addArtifact({ ...artifact, id: 'a2', name: 'output.csv' });
      expect(useExecutionStore.getState().artifacts).toHaveLength(2);
    });
  });

  describe('cost', () => {
    it('sets cost entry and tracks total', () => {
      const store = useExecutionStore.getState();
      store.setCost({ runId: 'r1', agentId: 'a1', cost: 0.5, budgetLimit: 1.0, timestamp: '' });
      store.addCost(0.3);
      store.addCost(0.2);
      expect(useExecutionStore.getState().cost?.cost).toBe(0.5);
      expect(useExecutionStore.getState().totalCost).toBe(0.5);
    });
  });

  describe('network requests', () => {
    it('adds and updates network requests', () => {
      const store = useExecutionStore.getState();
      store.addNetworkRequest({ id: 'req1', timestamp: '', method: 'GET', url: '/v0/agents' });
      store.updateNetworkRequest('req1', { status: 200, duration: 42 });
      const req = useExecutionStore.getState().networkRequests[0];
      expect(req.status).toBe(200);
      expect(req.duration).toBe(42);
    });

    it('caps at 500 requests', () => {
      const store = useExecutionStore.getState();
      for (let i = 0; i < 505; i++) {
        store.addNetworkRequest({ id: `req${i}`, timestamp: '', method: 'GET', url: `/v0/test/${i}` });
      }
      expect(useExecutionStore.getState().networkRequests).toHaveLength(500);
    });

    it('clears network requests', () => {
      useExecutionStore.getState().addNetworkRequest({ id: 'req1', timestamp: '', method: 'POST', url: '/v0/runs' });
      useExecutionStore.getState().clearNetworkRequests();
      expect(useExecutionStore.getState().networkRequests).toHaveLength(0);
    });
  });

  describe('inspector', () => {
    it('sets and clears inspector item', () => {
      const store = useExecutionStore.getState();
      store.setInspectorItem({ type: 'node', id: 'n1', name: 'Test Node', data: { label: 'Test' } });
      expect(useExecutionStore.getState().inspectorItem?.name).toBe('Test Node');
      store.setInspectorItem(null);
      expect(useExecutionStore.getState().inspectorItem).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('resets entire store', () => {
      const store = useExecutionStore.getState();
      store.addEvent({ id: 'e1', timestamp: '', type: 'TEST' });
      store.addProblem({ id: 'p1', severity: 'error', message: 'x', source: 'y' });
      store.addLog({ id: 'l1', timestamp: '', level: 'stdout', source: 'a', message: 'b' });
      store.addNetworkRequest({ id: 'r1', timestamp: '', method: 'GET', url: '/v0/x' });
      store.addCost(1.0);
      store.clearAll();

      const s = useExecutionStore.getState();
      expect(s.events).toHaveLength(0);
      expect(s.problems).toHaveLength(0);
      expect(s.logs).toHaveLength(0);
      expect(s.networkRequests).toHaveLength(0);
      expect(s.totalCost).toBe(0);
      expect(s.inspectorItem).toBeNull();
    });
  });
});
