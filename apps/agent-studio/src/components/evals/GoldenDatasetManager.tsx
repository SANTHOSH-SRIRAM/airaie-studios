import React from 'react';
import { cn, Button, EmptyState, Spinner } from '@airaie/ui';
import { Plus, Pencil, Trash2, FlaskConical } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useEvalCases, useDeleteEvalCase } from '@hooks/useEvals';
import type { EvalCase } from '@hooks/useEvals';

export interface GoldenDatasetManagerProps {
  onEdit: (id: string | null) => void;
  className?: string;
}

const GoldenDatasetManager: React.FC<GoldenDatasetManagerProps> = ({ onEdit, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: testCases, isLoading } = useEvalCases(agentId);
  const deleteMutation = useDeleteEvalCase();

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ agentId, evalId: id });
  };

  const summarizeCriteria = (c: EvalCase['criteria']): string => {
    const parts: string[] = [];
    if (c.min_actions != null) parts.push(`>=\u00a0${c.min_actions} actions`);
    if (c.max_actions != null) parts.push(`<=\u00a0${c.max_actions} actions`);
    if (c.min_score != null) parts.push(`score\u00a0>=\u00a0${c.min_score}`);
    if (c.max_cost != null) parts.push(`cost\u00a0<=\u00a0${c.max_cost}`);
    if (c.required_tools?.length) parts.push(`requires: ${c.required_tools.join(', ')}`);
    if (c.forbidden_tools?.length) parts.push(`forbids: ${c.forbidden_tools.join(', ')}`);
    return parts.length ? parts.join(' | ') : 'None';
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  const cases = testCases ?? [];

  if (cases.length === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-12', className)}>
        <EmptyState icon={FlaskConical} heading="No test cases yet" description="Add golden test cases to evaluate your agent." />
        <Button variant="primary" size="sm" icon={Plus} onClick={() => onEdit(null)}>
          Add Test Case
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-content-tertiary uppercase tracking-wider">
          Golden Dataset ({cases.length})
        </span>
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => onEdit(null)}>
          Add Test Case
        </Button>
      </div>

      <table className="w-full text-sm border border-border-default">
        <thead>
          <tr className="bg-surface-secondary text-content-secondary text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Input</th>
            <th className="text-left px-3 py-2">Criteria</th>
            <th className="text-right px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((tc) => (
            <tr key={tc.id} className="border-t border-border-default hover:bg-surface-secondary/50">
              <td className="px-3 py-2 font-medium text-content-primary">{tc.name}</td>
              <td className="px-3 py-2 text-content-muted font-mono text-xs max-w-[200px] truncate">
                {JSON.stringify(tc.inputs).slice(0, 60)}
              </td>
              <td className="px-3 py-2 text-content-secondary text-xs">{summarizeCriteria(tc.criteria)}</td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(tc.id)} className="p-1 text-content-muted hover:text-content-primary transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(tc.id)} className="p-1 text-content-muted hover:text-status-danger transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

GoldenDatasetManager.displayName = 'GoldenDatasetManager';

export default GoldenDatasetManager;
