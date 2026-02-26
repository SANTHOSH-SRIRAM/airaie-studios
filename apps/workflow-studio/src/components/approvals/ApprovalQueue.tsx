import React, { useState } from 'react';
import { cn, StatusBadge, Badge, Spinner, EmptyState, Input, Select } from '@airaie/ui';
import { ShieldCheck, Search } from 'lucide-react';
import { formatRelativeTime } from '@airaie/ui';
import type { KernelGate } from '@airaie/shared';
import { useGates } from '@hooks/useGates';

export interface ApprovalQueueProps {
  onSelectGate: (gateId: string) => void;
  className?: string;
}

const GATE_STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Evaluating', value: 'EVALUATING' },
  { label: 'Passed', value: 'PASSED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Waived', value: 'WAIVED' },
];

const gateStatusMap: Record<string, string> = {
  PENDING: 'pending',
  EVALUATING: 'running',
  PASSED: 'completed',
  FAILED: 'failed',
  WAIVED: 'cancelled',
};

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ onSelectGate, className }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data: gates, isLoading } = useGates(statusFilter ? { status: statusFilter } : undefined);

  const filtered = React.useMemo(() => {
    if (!gates) return [];
    if (!search) return gates;
    const q = search.toLowerCase();
    return gates.filter((g) => g.name.toLowerCase().includes(q) || g.gate_type.toLowerCase().includes(q));
  }, [gates, search]);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <Input placeholder="Search gates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={GATE_STATUS_OPTIONS} className="w-40" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} heading="No gates found" description="No approval gates match the current filter." />
      ) : (
        <div className="border border-surface-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-hover border-b border-surface-border">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Board</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((gate) => (
                <tr key={gate.id} onClick={() => onSelectGate(gate.id)} className="hover:bg-surface-hover cursor-pointer transition-colors">
                  <td className="px-4 py-2.5 font-medium text-content-primary">{gate.name}</td>
                  <td className="px-4 py-2.5 text-content-secondary capitalize">{gate.gate_type}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={(gateStatusMap[gate.status] || 'pending') as any} /></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-content-secondary">{gate.board_id?.slice(0, 8) || '—'}</td>
                  <td className="px-4 py-2.5 text-content-secondary">{formatRelativeTime(gate.metadata?.created_at as string || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

ApprovalQueue.displayName = 'ApprovalQueue';
export default ApprovalQueue;
