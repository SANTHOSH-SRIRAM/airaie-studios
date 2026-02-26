import React, { useState } from 'react';
import { cn, Spinner, Badge, Button, EmptyState } from '@airaie/ui';
import { formatRelativeTime } from '@airaie/ui';
import { GitCompare, Play, Upload } from 'lucide-react';
import { useWorkflowVersions, useCompileWorkflow } from '@hooks/useWorkflows';
import { useUIStore } from '@store/uiStore';
import type { KernelWorkflowVersion } from '@airaie/shared';
import PublishDialog from './PublishDialog';

interface VersionsListProps {
  onDiff: (v1: number, v2: number) => void;
  className?: string;
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'warning'> = {
  draft: 'warning',
  compiled: 'neutral',
  published: 'success',
};

function VersionsList({ onDiff, className }: VersionsListProps) {
  const workflowId = useUIStore((s) => s.workflowId);
  const { data: versions, isLoading } = useWorkflowVersions(workflowId);
  const compile = useCompileWorkflow();

  const [diffSelection, setDiffSelection] = useState<number[]>([]);
  const [publishVersion, setPublishVersion] = useState<number | null>(null);

  const toggleDiff = (v: number) => {
    setDiffSelection((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 2 ? [...prev, v] : [prev[1], v],
    );
  };

  if (isLoading) return <Spinner className="mx-auto mt-12" />;
  if (!versions?.length) return <EmptyState heading="No versions" description="Create a version to get started." />;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {diffSelection.length === 2 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-content-tertiary">
            Comparing v{diffSelection[0]} and v{diffSelection[1]}
          </span>
          <Button size="sm" onClick={() => onDiff(diffSelection[0], diffSelection[1])}>
            Compare
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDiffSelection([])}>
            Clear
          </Button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-content-tertiary">
            <th className="pb-2 font-medium">Version</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Created At</th>
            <th className="pb-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v: KernelWorkflowVersion) => (
            <tr key={v.id} className="border-b border-surface-border last:border-b-0">
              <td className="py-2 font-mono">#{v.version}</td>
              <td className="py-2">
                <Badge variant={STATUS_VARIANT[v.status] ?? 'neutral'}>{v.status}</Badge>
              </td>
              <td className="py-2 text-content-secondary">{formatRelativeTime(v.created_at)}</td>
              <td className="flex items-center justify-end gap-1 py-2">
                {v.status === 'draft' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={compile.isPending}
                    onClick={() => compile.mutate({ dsl: v.dsl })}
                  >
                    <Play className="mr-1 h-3 w-3" /> Compile
                  </Button>
                )}
                {v.status === 'compiled' && (
                  <Button size="sm" variant="ghost" onClick={() => setPublishVersion(v.version)}>
                    <Upload className="mr-1 h-3 w-3" /> Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={diffSelection.includes(v.version) ? 'primary' : 'ghost'}
                  onClick={() => toggleDiff(v.version)}
                >
                  <GitCompare className="mr-1 h-3 w-3" /> Diff
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {publishVersion !== null && (
        <PublishDialog open onClose={() => setPublishVersion(null)} version={publishVersion} />
      )}
    </div>
  );
}

VersionsList.displayName = 'VersionsList';
export default VersionsList;
