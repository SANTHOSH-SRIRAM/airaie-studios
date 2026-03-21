import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ParsedCSV } from './shared/csv-utils';

// Mock csv-utils
const mockParseCSVFromUrl = vi.fn<(url: string) => Promise<ParsedCSV>>();
vi.mock('./shared/csv-utils', () => ({
  parseCSVFromUrl: (...args: unknown[]) => mockParseCSVFromUrl(args[0] as string),
  detectChartType: () => 'line' as const,
  ROW_LIMIT: 10_000,
}));

// Mock ChartViewer
vi.mock('./ChartViewer', () => ({
  default: () => <div data-testid="chart-viewer">Chart</div>,
}));

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
  }),
}));

// lucide-react is NOT mocked -- used transitively by @airaie/ui (Toast etc.)

import DataTableViewer from './DataTableViewer';

describe('DataTableViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows Skeleton while CSV is loading', () => {
    // Never resolve to keep loading state
    mockParseCSVFromUrl.mockReturnValue(new Promise(() => {}));

    render(<DataTableViewer url="http://example.com/data.csv" />);

    expect(screen.getByTestId('data-table-loading')).toBeInTheDocument();
  });

  it('renders table headers from CSV columns', async () => {
    mockParseCSVFromUrl.mockResolvedValue({
      headers: ['name', 'value', 'unit'],
      rows: [{ name: 'test', value: 42, unit: 'Pa' }],
      totalRows: 1,
      truncated: false,
      meta: {} as any,
    });

    render(<DataTableViewer url="http://example.com/data.csv" />);

    await waitFor(() => {
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('value')).toBeInTheDocument();
      expect(screen.getByText('unit')).toBeInTheDocument();
    });
  });

  it('shows truncation warning banner when data is truncated', async () => {
    mockParseCSVFromUrl.mockResolvedValue({
      headers: ['x', 'y'],
      rows: Array.from({ length: 10_000 }, (_, i) => ({ x: i, y: i * 2 })),
      totalRows: 10_000,
      truncated: true,
      meta: {} as any,
    });

    render(<DataTableViewer url="http://example.com/big.csv" />);

    await waitFor(() => {
      expect(screen.getByText(/Showing first 10,000/)).toBeInTheDocument();
    });
  });

  it('renders "Table" and "Chart" toggle buttons', async () => {
    mockParseCSVFromUrl.mockResolvedValue({
      headers: ['x', 'y'],
      rows: [{ x: 1, y: 2 }],
      totalRows: 1,
      truncated: false,
      meta: {} as any,
    });

    render(<DataTableViewer url="http://example.com/data.csv" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Table/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Chart/i })).toBeInTheDocument();
    });
  });

  it('shows error when CSV parsing fails', async () => {
    mockParseCSVFromUrl.mockRejectedValue(new Error('Network error'));

    render(<DataTableViewer url="http://example.com/bad.csv" />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
