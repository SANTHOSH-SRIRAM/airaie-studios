import React, { useState, useMemo } from 'react';
import { cn, Spinner, EmptyState, Button, Input, Select } from '@airaie/ui';
import { formatBytes, formatRelativeTime } from '@airaie/ui';
import { Search, Download, GitBranch, Package } from 'lucide-react';
import { useArtifacts } from '@hooks/useArtifacts';
import { getDownloadURL } from '@api/artifacts';

export interface ArtifactCatalogProps {
  onSelectArtifact: (id: string) => void;
  onViewLineage: (id: string) => void;
  className?: string;
}

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Dataset', value: 'dataset' },
  { label: 'Model', value: 'model' },
  { label: 'Report', value: 'report' },
  { label: 'Log', value: 'log' },
];

const PAGE_SIZE = 20;

const ArtifactCatalog: React.FC<ArtifactCatalogProps> = ({
  onSelectArtifact,
  onViewLineage,
  className,
}) => {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);

  const { data: artifacts, isLoading } = useArtifacts({
    type: type || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const filtered = useMemo(() => {
    if (!artifacts) return [];
    if (!search) return artifacts;
    const q = search.toLowerCase();
    return artifacts.filter((a) => a.name.toLowerCase().includes(q));
  }, [artifacts, search]);

  const handleDownload = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { download_url } = await getDownloadURL(id);
    window.open(download_url, '_blank');
  };

  const handleLineage = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onViewLineage(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="pl-9"
          />
        </div>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setOffset(0);
          }}
          options={TYPE_OPTIONS}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          heading="No artifacts found"
          description="Artifacts produced by workflow runs will appear here."
        />
      ) : (
        <>
          <div className="border border-surface-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover border-b border-surface-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Type</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Size</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Created By</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-content-tertiary uppercase">Created At</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-content-tertiary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((artifact) => (
                  <tr
                    key={artifact.id}
                    onClick={() => onSelectArtifact(artifact.id)}
                    className="hover:bg-surface-hover cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 text-content-primary font-medium">{artifact.name}</td>
                    <td className="px-4 py-2.5 text-content-secondary capitalize">{artifact.type}</td>
                    <td className="px-4 py-2.5 text-right text-content-secondary tabular-nums">
                      {formatBytes(artifact.size_bytes)}
                    </td>
                    <td className="px-4 py-2.5 text-content-secondary">{artifact.created_by}</td>
                    <td className="px-4 py-2.5 text-content-secondary">
                      {formatRelativeTime(artifact.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDownload(e, artifact.id)}
                          title="Download"
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleLineage(e, artifact.id)}
                          title="View Lineage"
                        >
                          <GitBranch size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-content-tertiary">
            <span>
              Showing {offset + 1}–{offset + filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!artifacts || artifacts.length < PAGE_SIZE}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

ArtifactCatalog.displayName = 'ArtifactCatalog';

export default ArtifactCatalog;
