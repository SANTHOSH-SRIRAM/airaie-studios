import React, { useState } from 'react';
import { cn, Button, Badge, Select } from '@airaie/ui';
import { CheckCircle, Save, Upload, Download } from 'lucide-react';
import { useSpecStore } from '@store/specStore';
import { useUIStore } from '@store/uiStore';
import { useAgentVersions, useAgentVersion } from '@hooks/useAgents';

export interface AgentToolbarProps {
  onValidate?: () => void;
  onSave?: () => void;
  onPublish?: () => void;
  className?: string;
}

const AgentToolbar: React.FC<AgentToolbarProps> = ({
  onValidate,
  onSave,
  onPublish,
  className,
}) => {
  const isDirty = useSpecStore((s) => s.isDirty);
  const setSpec = useSpecStore((s) => s.setSpec);
  const agentName = useSpecStore((s) => s.agentName);
  const setAgentName = useSpecStore((s) => s.setAgentName);
  const agentId = useUIStore((s) => s.agentId);
  const { data: versions } = useAgentVersions(agentId);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [loading, setLoading] = useState(false);

  const versionOptions = [
    { value: '', label: 'Load version...' },
    ...(versions ?? []).map((v) => ({
      value: String(v.version),
      label: `v${v.version}${v.status === 'published' ? ' (published)' : ''}`,
    })),
  ];

  const handleLoadVersion = async () => {
    if (!selectedVersion || !agentId) return;
    setLoading(true);
    try {
      const { getVersion } = await import('@api/agents');
      const ver = await getVersion(agentId, Number(selectedVersion));
      if (ver?.spec) {
        setSpec(ver.spec as Record<string, unknown>);
      }
    } finally {
      setLoading(false);
      setSelectedVersion('');
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 border-b border-surface-border bg-white',
        className
      )}
    >
      {/* Editable name */}
      <input
        type="text"
        value={agentName}
        onChange={(e) => setAgentName(e.target.value)}
        className={cn(
          'text-sm font-medium text-content-primary bg-transparent border-none',
          'focus:outline-none focus:ring-0 hover:bg-surface-hover px-1 py-0.5',
          'min-w-0 max-w-[200px] truncate'
        )}
      />

      <Badge variant="info" badgeStyle="outline">
        v0.1.0
      </Badge>

      {isDirty && (
        <span className="w-2 h-2 bg-status-warning flex-shrink-0" title="Unsaved changes" />
      )}

      <div className="flex-1" />

      {/* Load from version */}
      {agentId && versions && versions.length > 0 && (
        <div className="flex items-center gap-1">
          <Select
            options={versionOptions}
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="w-40 text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Download}
            onClick={handleLoadVersion}
            disabled={!selectedVersion || loading}
            loading={loading}
            title="Load spec from version"
          />
        </div>
      )}

      {/* Action buttons */}
      <Button variant="outline" size="sm" icon={CheckCircle} onClick={onValidate}>
        Validate
      </Button>
      <Button variant="secondary" size="sm" icon={Save} onClick={onSave}>
        Save
      </Button>
      <Button variant="primary" size="sm" icon={Upload} onClick={onPublish}>
        Publish
      </Button>
    </div>
  );
};

AgentToolbar.displayName = 'AgentToolbar';

export default AgentToolbar;
