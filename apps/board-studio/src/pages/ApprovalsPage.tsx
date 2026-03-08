// ============================================================
// ApprovalsPage — Approval management with tabs, audit trail, stats
// ============================================================

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Badge, Select, Card } from '@airaie/ui';
import type { SelectOption } from '@airaie/ui';
import { usePendingApprovalCount, usePendingApprovals } from '@hooks/useApprovals';
import { useBoards } from '@hooks/useBoards';
import ApprovalQueue from '@components/boards/ApprovalQueue';
import type { GateType } from '@/types/board';
import { formatDateTime } from '@airaie/ui';

type TabId = 'pending' | 'resolved' | 'all';

const TABS: { id: TabId; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
];

const GATE_TYPE_FILTERS: { value: '' | GateType; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'evidence', label: 'Evidence' },
  { value: 'review', label: 'Review' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'exception', label: 'Exception' },
];

function AuditTrailRow({ gate }: { gate: any }) {
  const events = useMemo(() => {
    const items: { label: string; time: string; icon: React.ReactNode }[] = [];
    if (gate.created_at) {
      items.push({
        label: 'Created',
        time: gate.created_at,
        icon: <Clock size={12} className="text-content-muted" />,
      });
    }
    if (gate.evaluated_at) {
      items.push({
        label: 'Evaluated',
        time: gate.evaluated_at,
        icon: <AlertTriangle size={12} className="text-amber-500" />,
      });
    }
    if (gate.approved_at) {
      items.push({
        label: 'Approved',
        time: gate.approved_at,
        icon: <CheckCircle2 size={12} className="text-green-600" />,
      });
    }
    if (gate.rejected_at) {
      items.push({
        label: 'Rejected',
        time: gate.rejected_at,
        icon: <XCircle size={12} className="text-red-600" />,
      });
    }
    return items;
  }, [gate]);

  if (events.length <= 1) return null;

  return (
    <div className="flex items-center gap-4 mt-1.5">
      {events.map((ev, i) => (
        <React.Fragment key={ev.label}>
          {i > 0 && <div className="w-4 h-px bg-surface-border" />}
          <div className="flex items-center gap-1 text-[10px] text-content-muted">
            {ev.icon}
            <span>{ev.label}</span>
            <span className="text-content-tertiary">{formatDateTime(ev.time)}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [filterBoardId, setFilterBoardId] = useState('');
  const [filterGateType, setFilterGateType] = useState<'' | GateType>('');
  const { data: pendingCount } = usePendingApprovalCount();
  const { data: boards } = useBoards();
  const { data: pendingGates } = usePendingApprovals(filterBoardId || undefined);

  // Stats
  const stats = useMemo(() => {
    const gates = pendingGates ?? [];
    const byType: Record<string, number> = {};
    for (const g of gates) {
      byType[g.type] = (byType[g.type] ?? 0) + 1;
    }
    return { total: gates.length, byType };
  }, [pendingGates]);

  // Board filter options
  const boardOptions: SelectOption[] = [
    { value: '', label: 'All boards' },
    ...(boards ?? []).map((b) => ({
      value: b.id,
      label: b.name,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-content-primary" />
          <h1 className="text-xl font-bold text-content-primary">Approvals</h1>
          {pendingCount > 0 && (
            <Badge variant="danger" dot>
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Board filter */}
        <div className="w-64">
          <Select
            options={boardOptions}
            value={filterBoardId}
            onChange={(e) => setFilterBoardId(e.target.value)}
            placeholder="Filter by board"
          />
        </div>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="flex gap-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <Card key={type} className="px-4 py-2">
              <div className="text-[10px] uppercase tracking-wider text-content-muted">{type}</div>
              <div className="text-lg font-bold text-content-primary">{count}</div>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-surface-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-secondary text-brand-secondary'
                : 'border-transparent text-content-muted hover:text-content-primary'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}

        {/* Gate type filter chips */}
        <div className="ml-auto flex items-center gap-1">
          {GATE_TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilterGateType(f.value)}
              className={`text-[10px] px-2 py-1 border transition-colors ${
                filterGateType === f.value
                  ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/5'
                  : 'border-surface-border text-content-muted hover:text-content-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <ApprovalQueue boardId={filterBoardId || undefined} gateTypeFilter={filterGateType || undefined} />
      )}

      {activeTab === 'resolved' && (
        <div className="text-sm text-content-tertiary py-8 text-center">
          Resolved approvals will appear here when the audit history endpoint is available.
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          <ApprovalQueue boardId={filterBoardId || undefined} gateTypeFilter={filterGateType || undefined} />
          {/* Audit trail for visible gates */}
          {pendingGates && pendingGates.length > 0 && (
            <Card>
              <Card.Header>
                <h3 className="text-sm font-semibold text-content-primary">Audit Trail</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  {pendingGates.map((gate) => (
                    <div key={gate.id} className="border-b border-surface-border last:border-0 pb-2 last:pb-0">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-content-primary">{gate.name}</span>
                        <Badge variant="neutral" className="text-[9px]">{gate.type}</Badge>
                      </div>
                      <AuditTrailRow gate={gate} />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
