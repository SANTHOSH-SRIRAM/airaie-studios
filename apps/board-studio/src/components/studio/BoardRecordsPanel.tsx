// ============================================================
// BoardRecordsPanel — display and add board records
// ============================================================

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Badge, Spinner } from '@airaie/ui';
import { useRecords, useCreateRecord, useDeleteRecord } from '@hooks/useRecords';
import type { RecordType } from '@/types/board';

const RECORD_TYPES: { value: RecordType; label: string }[] = [
  { value: 'hypothesis', label: 'Hypothesis' },
  { value: 'decision', label: 'Decision' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'observation', label: 'Observation' },
  { value: 'risk', label: 'Risk' },
  { value: 'action_item', label: 'Action Item' },
];

const typeVariant: Record<RecordType, string> = {
  hypothesis: 'info',
  decision: 'success',
  requirement: 'warning',
  observation: 'neutral',
  risk: 'danger',
  action_item: 'info',
};

interface BoardRecordsPanelProps {
  boardId: string;
}

const BoardRecordsPanel: React.FC<BoardRecordsPanelProps> = ({ boardId }) => {
  const { data: records, isLoading } = useRecords(boardId);
  const createRecord = useCreateRecord(boardId);
  const deleteRecord = useDeleteRecord(boardId);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<RecordType>('observation');
  const [newContent, setNewContent] = useState('');

  const handleAdd = () => {
    if (!newContent.trim()) return;
    createRecord.mutate(
      { type: newType, content: newContent.trim() },
      { onSuccess: () => { setAdding(false); setNewContent(''); } }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  const grouped = RECORD_TYPES.map((rt) => ({
    ...rt,
    items: (records ?? []).filter((r) => r.type === rt.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3">
      {/* Add record form */}
      {adding ? (
        <div className="p-2 border border-surface-border bg-surface-bg space-y-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as RecordType)}
            className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white text-content-primary"
          >
            {RECORD_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Record content..."
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-surface-border bg-white
              text-content-primary resize-none focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button variant="primary" size="sm" onClick={handleAdd} loading={createRecord.isPending} disabled={!newContent.trim()}>
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setAdding(true)}>
          Add Record
        </Button>
      )}

      {/* Records grouped by type */}
      {grouped.map((group) => (
        <div key={group.value}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={typeVariant[group.value] as any} className="text-[10px]">{group.label}</Badge>
            <span className="text-[10px] text-content-muted studio-mono">{group.items.length}</span>
          </div>
          <div className="space-y-1">
            {group.items.map((record) => (
              <div key={record.id} className="flex items-start gap-2 text-xs p-1.5 border border-surface-border bg-white">
                <span className="flex-1 text-content-primary">{record.content}</span>
                <button
                  onClick={() => deleteRecord.mutate(record.id)}
                  className="p-0.5 text-content-muted hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!records || records.length === 0) && !adding && (
        <span className="text-xs text-content-muted">No records yet.</span>
      )}
    </div>
  );
};

BoardRecordsPanel.displayName = 'BoardRecordsPanel';

export default BoardRecordsPanel;
