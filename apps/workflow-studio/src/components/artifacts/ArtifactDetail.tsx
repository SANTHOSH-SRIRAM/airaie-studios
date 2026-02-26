import React from 'react';
import { cn, Spinner, Modal, Badge, JsonViewer } from '@airaie/ui';
import { formatBytes, formatRelativeTime } from '@airaie/ui';
import { useArtifact } from '@hooks/useArtifacts';

export interface ArtifactDetailProps {
  artifactId: string | null;
  onClose: () => void;
}

const ArtifactDetail: React.FC<ArtifactDetailProps> = ({ artifactId, onClose }) => {
  const { data: artifact, isLoading } = useArtifact(artifactId ?? '');

  return (
    <Modal open={!!artifactId} onClose={onClose} title="Artifact Details">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : artifact ? (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4">
            <span className="text-content-tertiary font-medium">Name</span>
            <span className="text-content-primary">{artifact.name}</span>

            <span className="text-content-tertiary font-medium">Type</span>
            <span>
              <Badge variant="neutral" badgeStyle="outline">{artifact.type}</Badge>
            </span>

            <span className="text-content-tertiary font-medium">Size</span>
            <span className="text-content-secondary">{formatBytes(artifact.size_bytes)}</span>

            <span className="text-content-tertiary font-medium">Content Hash</span>
            <span className="font-mono text-xs text-content-secondary break-all">
              {artifact.content_hash}
            </span>

            <span className="text-content-tertiary font-medium">Storage URI</span>
            <span className="font-mono text-xs text-content-secondary break-all">
              {artifact.storage_uri}
            </span>

            <span className="text-content-tertiary font-medium">Created By</span>
            <span className="text-content-secondary">{artifact.created_by}</span>

            <span className="text-content-tertiary font-medium">Created At</span>
            <span className="text-content-secondary">
              {formatRelativeTime(artifact.created_at)}
            </span>
          </div>

          {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <span className="text-content-tertiary font-medium text-xs uppercase">Metadata</span>
              <JsonViewer data={artifact.metadata} />
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

ArtifactDetail.displayName = 'ArtifactDetail';

export default ArtifactDetail;
