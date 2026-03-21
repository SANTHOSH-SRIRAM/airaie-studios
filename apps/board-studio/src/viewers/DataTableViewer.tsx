import React, { useEffect, useRef, useState, useMemo, lazy, Suspense } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@airaie/ui';
import type { ViewerProps } from '@/types/viewer';
import { parseCSVFromUrl, detectChartType, ROW_LIMIT, type ParsedCSV, type ChartType } from './shared/csv-utils';

const ChartViewer = lazy(() => import('./ChartViewer'));

// ─── Column builder ─────────────────────────────────────────

function buildColumns(headers: string[]): ColumnDef<Record<string, unknown>>[] {
  return headers.map((header) => ({
    accessorKey: header,
    header: () => header,
    cell: (info) => {
      const val = info.getValue();
      if (val === null || val === undefined) return '';
      return String(val);
    },
  }));
}

// ─── Sort indicator ─────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ChevronUp size={14} className="inline ml-1" />;
  if (direction === 'desc') return <ChevronDown size={14} className="inline ml-1" />;
  return <ChevronsUpDown size={14} className="inline ml-1 text-slate-300" />;
}

// ─── Main component ─────────────────────────────────────────

const DataTableViewer: React.FC<ViewerProps> = ({ url, onDownload }) => {
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [chartTypeOverride, setChartTypeOverride] = useState<ChartType | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // ─── Fetch CSV ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    parseCSVFromUrl(url)
      .then((data) => {
        if (!cancelled) {
          setParsedData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // ─── Columns ────────────────────────────────────────────
  const columns = useMemo(
    () => (parsedData ? buildColumns(parsedData.headers) : []),
    [parsedData],
  );

  // ─── Table instance ─────────────────────────────────────
  const table = useReactTable({
    data: parsedData?.rows ?? [],
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // ─── Virtualizer ────────────────────────────────────────
  const { rows: tableRows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 35,
    overscan: 20,
  });

  // ─── Chart type ─────────────────────────────────────────
  const detectedChartType = useMemo(
    () =>
      parsedData
        ? detectChartType(parsedData.headers, parsedData.rows)
        : ('line' as ChartType),
    [parsedData],
  );

  const activeChartType = chartTypeOverride ?? detectedChartType;

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div data-testid="data-table-loading" className="p-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded" role="alert">
        <p className="font-medium">Failed to load CSV</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!parsedData) return null;

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Toggle bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            viewMode === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => setViewMode('chart')}
          className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            viewMode === 'chart'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chart
        </button>

        {/* Chart type selector (visible in chart mode) */}
        {viewMode === 'chart' && (
          <select
            value={activeChartType}
            onChange={(e) => setChartTypeOverride(e.target.value as ChartType)}
            className="ml-auto px-2 py-1 text-sm border border-slate-300 rounded"
            aria-label="Chart type"
          >
            <option value="line">Line</option>
            <option value="scatter">Scatter</option>
            <option value="bar">Bar</option>
          </select>
        )}
      </div>

      {/* Truncation warning */}
      {parsedData.truncated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            Showing first 10,000 of {parsedData.totalRows.toLocaleString()}+ rows.
          </span>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="ml-auto text-amber-700 underline hover:text-amber-900"
            >
              Download full file
            </button>
          )}
        </div>
      )}

      {/* Chart view */}
      {viewMode === 'chart' && (
        <div className="p-4">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <ChartViewer
              headers={parsedData.headers}
              rows={parsedData.rows}
              chartType={activeChartType}
            />
          </Suspense>
        </div>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto"
          style={{ height: 'calc(100% - 80px)' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              {/* Header row */}
              <tr>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 text-left font-medium text-slate-700 border-b border-slate-200 cursor-pointer select-none hover:bg-slate-50"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <SortIcon direction={header.column.getIsSorted()} />
                    </th>
                  )),
                )}
              </tr>
              {/* Filter row */}
              <tr>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <th key={`filter-${header.id}`} className="px-3 py-1 border-b border-slate-100">
                      <input
                        type="text"
                        value={(header.column.getFilterValue() as string) ?? ''}
                        onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                        placeholder={`Filter...`}
                        className="w-full px-2 py-1 text-xs font-normal border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        aria-label={`Filter ${header.column.id}`}
                      />
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {/* Spacer for virtualization */}
              <tr style={{ height: 0 }}>
                <td colSpan={columns.length} style={{ padding: 0 }} />
              </tr>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = tableRows[virtualRow.index];
                return (
                  <tr
                    key={row.id}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      position: 'absolute',
                      width: '100%',
                      display: 'table-row',
                    }}
                    className="hover:bg-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3 py-1.5 text-slate-600 border-b border-slate-100 truncate max-w-xs"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Row count */}
          <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-200">
            {tableRows.length.toLocaleString()} rows
            {columnFilters.length > 0 &&
              ` (filtered from ${parsedData.rows.length.toLocaleString()})`}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTableViewer;
