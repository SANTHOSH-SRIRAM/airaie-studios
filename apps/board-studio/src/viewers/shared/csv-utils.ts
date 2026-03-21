import Papa from 'papaparse';

// ─── Constants ──────────────────────────────────────────────
export const ROW_LIMIT = 10_000;

// ─── Types ──────────────────────────────────────────────────
export interface ParsedCSV {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  truncated: boolean;
  meta: Papa.ParseMeta;
}

export type ChartType = 'line' | 'scatter' | 'bar';

// ─── CSV Parsing ────────────────────────────────────────────

/**
 * Fetch and parse a CSV file from a URL.
 * Uses streaming download with a 10K row preview limit.
 */
export function parseCSVFromUrl(url: string): Promise<ParsedCSV> {
  return new Promise<ParsedCSV>((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      preview: ROW_LIMIT,
      complete(results) {
        resolve({
          headers: results.meta.fields ?? [],
          rows: results.data,
          totalRows: results.data.length,
          truncated: results.meta.aborted || results.data.length >= ROW_LIMIT,
          meta: results.meta,
        });
      },
      error(err: Error) {
        reject(new Error(err.message));
      },
    });
  });
}

// ─── Chart Type Detection ───────────────────────────────────

/**
 * Heuristically detect the best chart type from CSV column structure.
 *
 * - 'line'    — first column is monotonically non-decreasing numbers (convergence plot)
 * - 'scatter' — all columns are numeric (Pareto front)
 * - 'bar'     — mixed categorical + numeric (comparison)
 * - 'line'    — fallback for edge cases
 */
export function detectChartType(
  headers: string[],
  rows: Record<string, unknown>[],
): ChartType {
  // Guard: insufficient data
  if (rows.length === 0 || headers.length < 2) {
    return 'line';
  }

  const sample = rows.slice(0, 100);

  // Check time series: first column values are all numbers AND monotonically non-decreasing
  const firstCol = headers[0];
  const firstColValues = sample.map((r) => r[firstCol]);
  const allNumbers = firstColValues.every(
    (v) => typeof v === 'number' && !Number.isNaN(v),
  );

  if (allNumbers) {
    let monotonic = true;
    for (let i = 1; i < firstColValues.length; i++) {
      if ((firstColValues[i] as number) < (firstColValues[i - 1] as number)) {
        monotonic = false;
        break;
      }
    }
    if (monotonic) {
      return 'line';
    }
  }

  // Count numeric columns
  const numericCols = headers.filter((h) =>
    sample.every((r) => {
      const v = r[h];
      return (typeof v === 'number' && !Number.isNaN(v)) || v === null;
    }),
  );

  // All columns numeric -> scatter
  if (numericCols.length >= 2 && numericCols.length === headers.length) {
    return 'scatter';
  }

  // Otherwise -> bar
  return 'bar';
}
