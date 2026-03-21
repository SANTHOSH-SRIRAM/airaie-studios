import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ParseResult, ParseConfig } from 'papaparse';

// Mock papaparse before importing csv-utils
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

import Papa from 'papaparse';
import { parseCSVFromUrl, detectChartType, ROW_LIMIT } from './csv-utils';

const mockParse = vi.mocked(Papa.parse);

describe('csv-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseCSVFromUrl', () => {
    it('returns headers, rows, totalRows, truncated=false for small CSV', async () => {
      const testData = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ];

      mockParse.mockImplementation((_url: unknown, config?: ParseConfig) => {
        config?.complete?.({
          data: testData,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: 0,
            fields: ['x', 'y'],
          },
        } as ParseResult<Record<string, unknown>>);
        return undefined as never;
      });

      const result = await parseCSVFromUrl('http://example.com/data.csv');

      expect(result.headers).toEqual(['x', 'y']);
      expect(result.rows).toEqual(testData);
      expect(result.totalRows).toBe(2);
      expect(result.truncated).toBe(false);
    });

    it('sets truncated=true when row count reaches ROW_LIMIT', async () => {
      const testData = Array.from({ length: ROW_LIMIT }, (_, i) => ({ idx: i, val: i * 2 }));

      mockParse.mockImplementation((_url: unknown, config?: ParseConfig) => {
        config?.complete?.({
          data: testData,
          errors: [],
          meta: {
            delimiter: ',',
            linebreak: '\n',
            aborted: false,
            truncated: false,
            cursor: 0,
            fields: ['idx', 'val'],
          },
        } as ParseResult<Record<string, unknown>>);
        return undefined as never;
      });

      const result = await parseCSVFromUrl('http://example.com/big.csv');

      expect(result.truncated).toBe(true);
      expect(result.totalRows).toBe(ROW_LIMIT);
    });
  });

  describe('detectChartType', () => {
    it('returns "line" for monotonically increasing first column (convergence plot)', () => {
      const headers = ['iteration', 'residual'];
      const rows = [
        { iteration: 1, residual: 0.5 },
        { iteration: 2, residual: 0.3 },
        { iteration: 3, residual: 0.1 },
        { iteration: 4, residual: 0.05 },
        { iteration: 5, residual: 0.01 },
      ];

      expect(detectChartType(headers, rows)).toBe('line');
    });

    it('returns "scatter" for all-numeric columns (Pareto front)', () => {
      const headers = ['obj1', 'obj2'];
      const rows = [
        { obj1: 1.2, obj2: 5.4 },
        { obj1: 3.1, obj2: 2.3 },
        { obj1: 0.8, obj2: 7.1 },
        { obj1: 4.5, obj2: 1.0 },
      ];

      expect(detectChartType(headers, rows)).toBe('scatter');
    });

    it('returns "bar" for mixed categorical + numeric columns', () => {
      const headers = ['category', 'value'];
      const rows = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
        { category: 'C', value: 30 },
      ];

      expect(detectChartType(headers, rows)).toBe('bar');
    });

    it('returns "line" for empty or single-column data (fallback)', () => {
      expect(detectChartType([], [])).toBe('line');
      expect(detectChartType(['only'], [{ only: 1 }])).toBe('line');
    });
  });
});
