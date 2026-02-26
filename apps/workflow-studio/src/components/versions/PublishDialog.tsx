import React, { useState } from 'react';
import { Modal, Button } from '@airaie/ui';
import { usePublishVersion } from '@hooks/useWorkflows';
import { useUIStore } from '@store/uiStore';

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  version: number;
}

function PublishDialog({ open, onClose, version }: PublishDialogProps) {
  const workflowId = useUIStore((s) => s.workflowId);
  const publish = usePublishVersion();
  const [rationale, setRationale] = useState('');

  const handlePublish = () => {
    publish.mutate({ workflowId, version }, { onSuccess: onClose });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Publish Version ${version}`}>
      <div className="flex flex-col gap-4">
        <textarea
          className="w-full rounded-none border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          rows={3}
          placeholder="Rationale (optional)"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={publish.isPending}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publish.isPending}>
            {publish.isPending ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

PublishDialog.displayName = 'PublishDialog';
export default PublishDialog;
