import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartViewer from './ChartViewer';

// Mock @airaie/charts with test components
vi.mock('@airaie/charts', () => ({
  LineChart: ({ children, ...props }: any) => (
    <div data-testid="line-chart" {...props}>{children}</div>
  ),
  ScatterChart: ({ children, ...props }: any) => (
    <div data-testid="scatter-chart" {...props}>{children}</div>
  ),
  BarChart: ({ children, ...props }: any) => (
    <div data-testid="bar-chart" {...props}>{children}</div>
  ),
  ResponsiveContainer: ({ children, ...props }: any) => (
    <div data-testid="responsive-container" {...props}>{children}</div>
  ),
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: (props: any) => <div data-testid="tooltip" {...props} />,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  Line: (props: any) => <div data-testid="line" {...props} />,
  Scatter: (props: any) => <div data-testid="scatter" {...props} />,
  Bar: (props: any) => <div data-testid="bar" {...props} />,
}));

const sampleHeaders = ['x', 'y', 'z'];
const sampleRows = [
  { x: 1, y: 2, z: 3 },
  { x: 4, y: 5, z: 6 },
];

describe('ChartViewer', () => {
  it('renders a LineChart when chartType is "line"', () => {
    render(
      <ChartViewer headers={sampleHeaders} rows={sampleRows} chartType="line" />,
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders a ScatterChart when chartType is "scatter"', () => {
    render(
      <ChartViewer headers={sampleHeaders} rows={sampleRows} chartType="scatter" />,
    );
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
  });

  it('renders a BarChart when chartType is "bar"', () => {
    render(
      <ChartViewer headers={sampleHeaders} rows={sampleRows} chartType="bar" />,
    );
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders ResponsiveContainer wrapper', () => {
    render(
      <ChartViewer headers={sampleHeaders} rows={sampleRows} chartType="line" />,
    );
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });
});
