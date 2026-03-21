import React from 'react';
import {
  LineChart,
  ScatterChart,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Scatter,
  Bar,
} from '@airaie/charts';
import type { ChartType } from './shared/csv-utils';

// ─── Color palette for multi-series ─────────────────────────
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

// ─── Props ──────────────────────────────────────────────────
interface ChartViewerProps {
  headers: string[];
  rows: Record<string, unknown>[];
  chartType: ChartType;
}

// ─── Chart Renderers ────────────────────────────────────────

function renderLineChart(
  headers: string[],
  rows: Record<string, unknown>[],
) {
  const [xKey, ...yKeys] = headers;
  return (
    <LineChart data={rows}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {yKeys.map((key, i) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={COLORS[i % COLORS.length]}
          dot={false}
        />
      ))}
    </LineChart>
  );
}

function renderScatterChart(
  headers: string[],
  rows: Record<string, unknown>[],
) {
  return (
    <ScatterChart>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={headers[0]} name={headers[0]} />
      <YAxis dataKey={headers[1]} name={headers[1]} />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Scatter data={rows} fill="#2563eb" />
    </ScatterChart>
  );
}

function renderBarChart(
  headers: string[],
  rows: Record<string, unknown>[],
) {
  const [xKey, ...valueKeys] = headers;
  // Only use numeric-looking keys for bars
  const numericKeys = valueKeys.filter((key) =>
    rows.some((r) => typeof r[key] === 'number'),
  );
  const barKeys = numericKeys.length > 0 ? numericKeys : valueKeys;

  return (
    <BarChart data={rows}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
      {barKeys.map((key, i) => (
        <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
      ))}
    </BarChart>
  );
}

// ─── Component ──────────────────────────────────────────────

const ChartViewer: React.FC<ChartViewerProps> = ({
  headers,
  rows,
  chartType,
}) => {
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart(headers, rows);
      case 'scatter':
        return renderScatterChart(headers, rows);
      case 'bar':
        return renderBarChart(headers, rows);
      default:
        return renderLineChart(headers, rows);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default ChartViewer;
