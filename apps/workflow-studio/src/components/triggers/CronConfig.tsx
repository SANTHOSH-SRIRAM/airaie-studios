import React, { useState, useEffect, useMemo } from 'react';
import { cn, Button, Input } from '@airaie/ui';
import { Clock, Calendar } from 'lucide-react';

export interface CronConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  className?: string;
}

const PRESETS: { label: string; expression: string }[] = [
  { label: 'Every hour', expression: '0 * * * *' },
  { label: 'Every day', expression: '0 0 * * *' },
  { label: 'Every week', expression: '0 0 * * 0' },
  { label: 'Every month', expression: '0 0 1 * *' },
];

function parseCronField(field: string, min: number, max: number): number[] | null {
  const values = new Set<number>();
  const parts = field.split(',');
  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return null;
      const start = range === '*' ? min : parseInt(range, 10);
      if (isNaN(start)) return null;
      for (let i = start; i <= max; i += step) values.add(i);
    } else if (part.includes('-')) {
      const [lo, hi] = part.split('-').map(Number);
      if (isNaN(lo) || isNaN(hi)) return null;
      for (let i = lo; i <= hi; i++) values.add(i);
    } else {
      const n = parseInt(part, 10);
      if (isNaN(n) || n < min || n > max) return null;
      values.add(n);
    }
  }
  return Array.from(values).sort((a, b) => a - b);
}

function getNextExecutions(expression: string, count: number): Date[] | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const minutes = parseCronField(parts[0], 0, 59);
  const hours = parseCronField(parts[1], 0, 23);
  const daysOfMonth = parseCronField(parts[2], 1, 31);
  const months = parseCronField(parts[3], 1, 12);
  const daysOfWeek = parseCronField(parts[4], 0, 6);

  if (!minutes || !hours || !daysOfMonth || !months || !daysOfWeek) return null;

  const results: Date[] = [];
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const maxIterations = 525960; // ~1 year of minutes
  for (let i = 0; i < maxIterations && results.length < count; i++) {
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const mon = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (
      minutes.includes(m) &&
      hours.includes(h) &&
      daysOfMonth.includes(dom) &&
      months.includes(mon) &&
      daysOfWeek.includes(dow)
    ) {
      results.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return results;
}

const CronConfig: React.FC<CronConfigProps> = ({ config, onChange, className }) => {
  const expression = (config.expression as string) || '0 * * * *';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!config.expression) {
      onChange({ ...config, expression: '0 * * * *' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nextExecutions = useMemo(() => getNextExecutions(expression, 5), [expression]);

  const handleExpressionChange = (value: string) => {
    onChange({ ...config, expression: value });
  };

  return (
    <div className={cn('space-y-4 pt-4', className)}>
      <Input
        label="Cron Expression"
        icon={Clock}
        value={expression}
        onChange={(e) => handleExpressionChange(e.target.value)}
        placeholder="0 * * * *"
        className="font-mono"
      />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-content-secondary">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.expression}
              variant={expression === preset.expression ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleExpressionChange(preset.expression)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-content-muted" />
          <span className="text-xs font-medium text-content-secondary">Next 5 Executions</span>
          <span className="ml-auto text-xs text-content-muted">{timezone}</span>
        </div>
        {nextExecutions === null ? (
          <p className="text-xs text-status-danger px-2 py-1.5 bg-status-danger-light">
            Invalid cron expression
          </p>
        ) : nextExecutions.length === 0 ? (
          <p className="text-xs text-content-muted px-2 py-1.5">
            No upcoming executions found within the next year.
          </p>
        ) : (
          <ul className="space-y-1">
            {nextExecutions.map((date, i) => (
              <li key={i} className="flex items-center gap-2 px-2 py-1 text-xs text-content-secondary bg-surface-hover">
                <span className="font-mono tabular-nums">
                  {date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  {' '}
                  {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

CronConfig.displayName = 'CronConfig';
export default CronConfig;
