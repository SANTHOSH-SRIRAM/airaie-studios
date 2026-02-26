import React, { useState } from 'react';
import { cn, Button, Badge, StatusBadge, Spinner, EmptyState } from '@airaie/ui';
import { CheckCircle, Upload, GitCompare, FlaskConical } from 'lucide-react';
import { formatRelativeTime } from '@airaie/ui';
import type { KernelAgentVersion } from '@airaie/shared';
import { useUIStore } from '@store/uiStore';
import { useAgentVersions, useValidateAgentVersion, usePublishAgentVersion } from '@hooks/useAgents';

const statusVariant: Record<string, string> = {
  draft: 'pending',
  validated: 'running',
  published: 'completed',
};

export interface AgentVersionsListProps {
  onDiff: (versionA: number, versionB: number) => void;
  onABEval: (versionA: number, versionB: number) => void;
  className?: string;
}

const AgentVersionsList: React.FC<AgentVersionsListProps> = ({ onDiff, onABEval, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: versions, isLoading } = useAgentVersions(agentId);
  const validate = useValidateAgentVersion();
  const publish = usePublishAgentVersion();
  const [diffSelection, setDiffSelection] = useState<number[]>([]);
  const [abSelection, setAbSelection] = useState<number[]>([]);

  const toggleDiff = (v: number) => {
    setDiffSelection((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 2 ? [...prev, v] : [prev[1], v]
    );
  };

  const toggleAB = (v: number) => {
    setAbSelection((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : prev.length < 2 ? [...prev, v] : [prev[1], v]
    );
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!versions || versions.length === 0) {
    return <EmptyState icon={Upload} heading="No versions" description="Create a version from the builder to see it here." />;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {diffSelection.length === 2 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200">
          <span className="text-sm text-content-secondary">Compare v{diffSelection[0]} ↔ v{diffSelection[1]}</span>
          <Button variant="primary" size="sm" onClick={() => onDiff(diffSelection[0], diffSelection[1])}>View Diff</Button>
          <Button variant="ghost" size="sm" onClick={() => setDiffSelection([])}>Clear</Button>
        </div>
      )}
      {abSelection.length === 2 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200">
          <span className="text-sm text-content-secondary">A/B Eval v{abSelection[0]} vs v{abSelection[1]}</span>
          <Button variant="primary" size="sm" onClick={() => onABEval(abSelection[0], abSelection[1])}>Run A/B</Button>
          <Button variant="ghost" size="sm" onClick={() => setAbSelection([])}>Clear</Button>
        </div>
      )}

      <div className="border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-hover border-b border-surface-border">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Version</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Created</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {versions.map((v) => (
              <tr key={v.id} className="hover:bg-surface-hover">
                <td className="px-4 py-2.5 font-mono">#{v.version}</td>
                <td className="px-4 py-2.5"><StatusBadge status={(statusVariant[v.status] || 'pending') as any} /></td>
                <td className="px-4 py-2.5 text-content-secondary">{formatRelativeTime(v.id)}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {v.status === 'draft' && (
                      <Button variant="outline" size="sm" icon={CheckCircle}
                        onClick={() => validate.mutate({ agentId, version: v.version })}
                        loading={validate.isPending}>Validate</Button>
                    )}
                    {v.status === 'validated' && (
                      <Button variant="primary" size="sm" icon={Upload}
                        onClick={() => publish.mutate({ agentId, version: v.version })}
                        loading={publish.isPending}>Publish</Button>
                    )}
                    <Button variant={diffSelection.includes(v.version) ? 'primary' : 'ghost'} size="sm"
                      icon={GitCompare} onClick={() => toggleDiff(v.version)} />
                    <Button variant={abSelection.includes(v.version) ? 'primary' : 'ghost'} size="sm"
                      icon={FlaskConical} onClick={() => toggleAB(v.version)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

AgentVersionsList.displayName = 'AgentVersionsList';
export default AgentVersionsList;
