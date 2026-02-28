// ============================================================
// ApprovalsPage — Dedicated approval management page (/approvals)
// ============================================================

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge, Select } from '@airaie/ui';
import type { SelectOption } from '@airaie/ui';
import { usePendingApprovalCount } from '@hooks/useApprovals';
import { useBoards } from '@hooks/useBoards';
import ApprovalQueue from '@components/boards/ApprovalQueue';

export default function ApprovalsPage() {
  const [filterBoardId, setFilterBoardId] = useState('');
  const { data: pendingCount } = usePendingApprovalCount();
  const { data: boards } = useBoards();

  // Build board filter options
  const boardOptions: SelectOption[] = [
    { value: '', label: 'All boards' },
    ...(boards ?? []).map((b) => ({
      value: b.id,
      label: b.name,
    })),
  ];

  return (
    <div className="p-6 space-y-6">
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

      {/* Approval queue */}
      <ApprovalQueue boardId={filterBoardId || undefined} />
    </div>
  );
}
