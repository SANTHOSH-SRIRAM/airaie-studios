import React from 'react';
import { cn, Spinner } from '@airaie/ui';
import { Download } from 'lucide-react';
import { formatBytes } from '@airaie/ui';
import { useRunArtifacts } from '@hooks/useRuns';
import { safeOpen } from '@airaie/shared';
import * as artifactsApi from '@api/artifacts';

export interface RunArtifactsPanelProps {
  runId: string;
  className?: string;
}

const RunArtifactsPanel: React.FC<RunArtifactsPanelProps> = ({ runId, className }) => {
  const { data: artifacts, isLoading } = useRunArtifacts(runId);

  const handleDownload = async (artifactId: string) => {
    const { download_url } = await artifactsApi.getDownloadURL(artifactId);
    safeOpen(download_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-content-muted">
        No artifacts for this run.
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-hover border-b border-surface-border">
            <th className="px-4 py-2 text-left text-xs font-medium text-content-tertiary uppercase">Name</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-content-tertiary uppercase">Type</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-content-tertiary uppercase">Node</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-content-tertiary uppercase">Size</th>
            <th className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {artifacts.map((a) => (
            <tr key={a.id} className="hover:bg-surface-hover">
              <td className="px-4 py-2 text-content-primary">{a.name}</td>
              <td className="px-4 py-2 text-content-secondary">{a.type}</td>
              <td className="px-4 py-2 text-content-secondary font-mono text-xs">{(a as any).node_id ?? '—'}</td>
              <td className="px-4 py-2 text-right text-content-secondary tabular-nums">{formatBytes(a.size_bytes)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleDownload(a.id)}
                  className="p-1 text-content-muted hover:text-brand-secondary transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

RunArtifactsPanel.displayName = 'RunArtifactsPanel';

export default RunArtifactsPanel;
