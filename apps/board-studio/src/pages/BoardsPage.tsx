// ============================================================
// BoardsPage — board list with grid/table toggle, filters, sorting
// ============================================================

import React, { useState, useCallback } from 'react';
import { LayoutGrid, List, Plus, AlertCircle, ClipboardList } from 'lucide-react';
import { Button, Select, EmptyState, Spinner, cn } from '@airaie/ui';
import type { SelectOption } from '@airaie/ui';
import { useBoardUIStore } from '@store/boardStore';
import { useBoards } from '@hooks/useBoards';
import BoardCard from '@components/boards/BoardCard';
import BoardTableRow from '@components/boards/BoardTableRow';
import BoardFilters from '@components/boards/BoardFilters';
import SubBoardTree from '@components/boards/SubBoardTree';

// Lazy-loaded creation wizard (loaded in Task 3)
const TemplateGallery = React.lazy(() => import('@components/boards/TemplateGallery'));

const sortOptions: SelectOption[] = [
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'name', label: 'Name' },
  { value: 'readiness', label: 'Readiness' },
  { value: 'created_at', label: 'Created' },
];

// --- Skeleton loaders ---

function SkeletonCard() {
  return (
    <div className="bg-surface-card border border-surface-border shadow-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-200 rounded w-16" />
        <div className="h-5 bg-slate-200 rounded w-14" />
      </div>
      <div className="h-1 bg-slate-200 rounded w-full" />
      <div className="flex justify-between">
        <div className="h-3 bg-slate-200 rounded w-16" />
        <div className="h-3 bg-slate-200 rounded w-12" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-surface-border">
          <div className="h-4 bg-slate-200 rounded w-1/4" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-14" />
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

// --- Main page ---

export default function BoardsPage() {
  const { viewMode, setViewMode, sortBy, setSortBy, sortDir, activeFilters } = useBoardUIStore();
  const [expandedBoards, setExpandedBoards] = useState<Set<string>>(new Set());
  const [showGallery, setShowGallery] = useState(false);

  const { data: boards, isLoading, isError, refetch } = useBoards({
    mode: activeFilters.mode as any,
    status: activeFilters.status as any,
    type: activeFilters.type,
    search: activeFilters.search,
    sort: sortBy,
    sort_dir: sortDir,
  });

  const toggleExpand = useCallback((boardId: string) => {
    setExpandedBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) {
        next.delete(boardId);
      } else {
        next.add(boardId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-content-primary">Boards</h1>
        <Button icon={Plus} onClick={() => setShowGallery(true)}>
          New Board
        </Button>
      </div>

      {/* Filters + view controls */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <BoardFilters />

        <div className="flex items-center gap-3">
          {/* Sort */}
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            wrapperClassName="w-40"
          />

          {/* View toggle */}
          <div className="flex items-center border border-surface-border">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-surface-hover text-content-primary'
                  : 'text-content-muted hover:text-content-primary'
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table'
                  ? 'bg-surface-hover text-content-primary'
                  : 'text-content-muted hover:text-content-primary'
              )}
              aria-label="Table view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <SkeletonTable />
        )
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle size={32} className="text-status-danger" />
          <p className="text-sm text-content-secondary">Failed to load boards.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && boards && boards.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          heading="No boards yet"
          description="Create your first board to start organizing engineering work."
          action={
            <Button icon={Plus} onClick={() => setShowGallery(true)}>
              Create your first board
            </Button>
          }
        />
      )}

      {!isLoading && !isError && boards && boards.length > 0 && (
        viewMode === 'grid' ? (
          <div className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <div key={board.id}>
                  <BoardCard
                    board={board}
                    onExpand={toggleExpand}
                    expanded={expandedBoards.has(board.id)}
                  />
                  {expandedBoards.has(board.id) && (
                    <div className="mt-1 ml-2">
                      <SubBoardTree boardId={board.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-surface-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border bg-surface-hover">
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Readiness
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {boards.map((board) => (
                  <React.Fragment key={board.id}>
                    <BoardTableRow
                      board={board}
                      onExpand={toggleExpand}
                      expanded={expandedBoards.has(board.id)}
                    />
                    {expandedBoards.has(board.id) && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <SubBoardTree boardId={board.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Template gallery modal (loaded lazily) */}
      {showGallery && (
        <React.Suspense fallback={null}>
          <TemplateGallery open={showGallery} onClose={() => setShowGallery(false)} />
        </React.Suspense>
      )}
    </div>
  );
}
