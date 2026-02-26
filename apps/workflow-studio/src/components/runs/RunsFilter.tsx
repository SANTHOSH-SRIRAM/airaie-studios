import React from 'react';
import { cn, Select, Input } from '@airaie/ui';
import { Search } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELED', label: 'Canceled' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting Approval' },
];

export interface RunsFilterProps {
  status: string;
  search: string;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  className?: string;
}

const RunsFilter: React.FC<RunsFilterProps> = ({
  status,
  search,
  onStatusChange,
  onSearchChange,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Input
        icon={Search}
        placeholder="Search runs..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />
      <Select
        options={statusOptions}
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-44"
      />
    </div>
  );
};

RunsFilter.displayName = 'RunsFilter';

export default RunsFilter;
