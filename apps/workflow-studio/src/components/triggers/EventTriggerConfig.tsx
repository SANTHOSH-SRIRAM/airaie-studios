import React, { useEffect } from 'react';
import { cn, Input, Select } from '@airaie/ui';
import { Zap, Filter } from 'lucide-react';

const EVENT_OPTIONS = [
  { value: 'artifact.created', label: 'artifact.created' },
  { value: 'artifact.updated', label: 'artifact.updated' },
  { value: 'run.completed', label: 'run.completed' },
  { value: 'run.failed', label: 'run.failed' },
  { value: 'version.published', label: 'version.published' },
];

export interface EventTriggerConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  className?: string;
}

const EventTriggerConfig: React.FC<EventTriggerConfigProps> = ({ config, onChange, className }) => {
  const eventType = (config.eventType as string) || '';
  const filterExpression = (config.filterExpression as string) || '';

  useEffect(() => {
    if (!config.eventType) {
      onChange({ ...config, eventType: 'artifact.created', filterExpression: '' });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEventTypeChange = (value: string) => {
    onChange({ ...config, eventType: value, filterExpression });
  };

  const handleFilterChange = (value: string) => {
    onChange({ ...config, eventType, filterExpression: value });
  };

  return (
    <div className={cn('space-y-4 pt-4', className)}>
      <Select
        label="Event Type"
        options={EVENT_OPTIONS}
        value={eventType}
        onChange={(e) => handleEventTypeChange(e.target.value)}
        placeholder="Select an event..."
      />

      <Input
        label="Filter Expression"
        icon={Filter}
        value={filterExpression}
        onChange={(e) => handleFilterChange(e.target.value)}
        placeholder='$.artifact.type == "model"'
      />

      <div className="border-t border-surface-border pt-3">
        <p className="text-xs text-content-secondary leading-relaxed">
          Event filters use JSONPath-like expressions to match incoming event payloads.
          Only events where the filter evaluates to true will trigger this workflow.
          Leave the filter empty to trigger on all events of the selected type.
        </p>
      </div>
    </div>
  );
};

EventTriggerConfig.displayName = 'EventTriggerConfig';
export default EventTriggerConfig;
