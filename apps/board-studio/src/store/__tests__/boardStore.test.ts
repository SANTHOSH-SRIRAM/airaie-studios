import { describe, it, expect, beforeEach } from 'vitest';
import { useBoardUIStore } from '../boardStore';

describe('boardStore', () => {
  beforeEach(() => {
    // Reset to defaults
    useBoardUIStore.setState({
      viewMode: 'grid',
      sortBy: 'updated_at',
      sortDir: 'desc',
      activeFilters: {},
    });
  });

  describe('defaults', () => {
    it('starts with grid view mode', () => {
      expect(useBoardUIStore.getState().viewMode).toBe('grid');
    });

    it('starts with updated_at sort', () => {
      expect(useBoardUIStore.getState().sortBy).toBe('updated_at');
    });

    it('starts with desc sort direction', () => {
      expect(useBoardUIStore.getState().sortDir).toBe('desc');
    });

    it('starts with empty filters', () => {
      expect(useBoardUIStore.getState().activeFilters).toEqual({});
    });
  });

  describe('setViewMode', () => {
    it('switches to table view', () => {
      useBoardUIStore.getState().setViewMode('table');
      expect(useBoardUIStore.getState().viewMode).toBe('table');
    });

    it('switches back to grid view', () => {
      useBoardUIStore.getState().setViewMode('table');
      useBoardUIStore.getState().setViewMode('grid');
      expect(useBoardUIStore.getState().viewMode).toBe('grid');
    });
  });

  describe('setSortBy', () => {
    it('sets sort to name', () => {
      useBoardUIStore.getState().setSortBy('name');
      expect(useBoardUIStore.getState().sortBy).toBe('name');
    });

    it('sets sort to readiness', () => {
      useBoardUIStore.getState().setSortBy('readiness');
      expect(useBoardUIStore.getState().sortBy).toBe('readiness');
    });
  });

  describe('setSortDir', () => {
    it('sets direction to asc', () => {
      useBoardUIStore.getState().setSortDir('asc');
      expect(useBoardUIStore.getState().sortDir).toBe('asc');
    });
  });

  describe('setFilters / clearFilters', () => {
    it('sets active filters', () => {
      const filters = { mode: 'engineering', status: 'active', search: 'test' };
      useBoardUIStore.getState().setFilters(filters);
      expect(useBoardUIStore.getState().activeFilters).toEqual(filters);
    });

    it('clears filters to empty object', () => {
      useBoardUIStore.getState().setFilters({ mode: 'science' });
      useBoardUIStore.getState().clearFilters();
      expect(useBoardUIStore.getState().activeFilters).toEqual({});
    });
  });
});
