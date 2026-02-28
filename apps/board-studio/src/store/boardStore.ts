// ============================================================
// Board UI preferences store — Zustand with localStorage persist
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BoardFilters {
  mode?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface BoardUIStore {
  viewMode: 'grid' | 'table';
  sortBy: 'updated_at' | 'name' | 'readiness' | 'created_at';
  sortDir: 'asc' | 'desc';
  activeFilters: BoardFilters;

  setViewMode: (mode: 'grid' | 'table') => void;
  setSortBy: (sort: 'updated_at' | 'name' | 'readiness' | 'created_at') => void;
  setSortDir: (dir: 'asc' | 'desc') => void;
  setFilters: (filters: BoardFilters) => void;
  clearFilters: () => void;
}

export const useBoardUIStore = create<BoardUIStore>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      sortBy: 'updated_at',
      sortDir: 'desc',
      activeFilters: {},

      setViewMode: (viewMode) => set({ viewMode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortDir: (sortDir) => set({ sortDir }),
      setFilters: (activeFilters) => set({ activeFilters }),
      clearFilters: () => set({ activeFilters: {} }),
    }),
    { name: 'airaie-board-ui' }
  )
);
