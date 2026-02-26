import React, { useState } from 'react';
import { cn, Button, Badge } from '@airaie/ui';
import { CheckCircle, Save, Upload } from 'lucide-react';
import { useSpecStore } from '@store/specStore';

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
  const [agentName, setAgentName] = useState('Untitled Agent');

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
          'w-48 truncate'
        )}
      />

      <Badge variant="info" badgeStyle="outline">
        v0.1.0
      </Badge>

      {isDirty && (
        <span className="w-2 h-2 bg-status-warning flex-shrink-0" title="Unsaved changes" />
      )}

      <div className="flex-1" />

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
