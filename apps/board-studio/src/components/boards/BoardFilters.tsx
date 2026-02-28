// ============================================================
// BoardFilters — filter bar for mode, status, type, and search
// ============================================================

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input, Select, Button } from '@airaie/ui';
import type { SelectOption } from '@airaie/ui';
import { useBoardUIStore } from '@store/boardStore';

const modeOptions: SelectOption[] = [
  { value: '', label: 'All Modes' },
  { value: 'explore', label: 'Explore' },
  { value: 'study', label: 'Study' },
  { value: 'release', label: 'Release' },
];

const statusOptions: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
];

const typeOptions: SelectOption[] = [
  { value: '', label: 'All Types' },
  { value: 'simulation', label: 'Simulation' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'validation', label: 'Validation' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'research', label: 'Research' },
  { value: 'custom', label: 'Custom' },
];

const BoardFilters: React.FC = () => {
  const { activeFilters, setFilters, clearFilters } = useBoardUIStore();

  const hasFilters = !!(activeFilters.mode || activeFilters.status || activeFilters.type || activeFilters.search);

  return (
    <div className="flex items-end gap-3 flex-wrap">
      <Input
        icon={Search}
        placeholder="Search boards..."
        value={activeFilters.search ?? ''}
        onChange={(e) =>
          setFilters({ ...activeFilters, search: e.target.value || undefined })
        }
        wrapperClassName="w-56"
      />

      <Select
        label="Mode"
        options={modeOptions}
        value={activeFilters.mode ?? ''}
        onChange={(e) =>
          setFilters({ ...activeFilters, mode: e.target.value || undefined })
        }
        wrapperClassName="w-36"
      />

      <Select
        label="Status"
        options={statusOptions}
        value={activeFilters.status ?? ''}
        onChange={(e) =>
          setFilters({ ...activeFilters, status: e.target.value || undefined })
        }
        wrapperClassName="w-36"
      />

      <Select
        label="Type"
        options={typeOptions}
        value={activeFilters.type ?? ''}
        onChange={(e) =>
          setFilters({ ...activeFilters, type: e.target.value || undefined })
        }
        wrapperClassName="w-40"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
          Clear
        </Button>
      )}
    </div>
  );
};

BoardFilters.displayName = 'BoardFilters';

export default BoardFilters;
