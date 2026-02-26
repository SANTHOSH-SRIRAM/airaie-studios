import React, { useState } from 'react';
import { Modal, Button, Select, CodeEditor } from '@airaie/ui';
import { Play } from 'lucide-react';
import { useStartRun } from '@hooks/useRuns';

export interface StartRunDialogProps {
  open: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
  versions: { value: string; label: string }[];
  onRunCreated: (runId: string) => void;
}

const StartRunDialog: React.FC<StartRunDialogProps> = ({
  open,
  onClose,
  workflowId,
  workflowName,
  versions,
  onRunCreated,
}) => {
  const [selectedVersion, setSelectedVersion] = useState(versions[0]?.value ?? '');
  const [inputJson, setInputJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const startRun = useStartRun();

  const handleStart = () => {
    try {
      const inputs = JSON.parse(inputJson);
      setJsonError(null);
      startRun.mutate(
        {
          workflow_id: workflowId,
          workflow_version: Number(selectedVersion) as any,
          inputs,
        },
        {
          onSuccess: (run) => {
            onRunCreated(run.id);
            onClose();
          },
        }
      );
    } catch {
      setJsonError('Invalid JSON input');
    }
  };

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-content-primary">Start Run</h2>

        <div className="space-y-1">
          <label className="text-sm text-content-secondary">Workflow</label>
          <p className="text-sm font-medium text-content-primary">{workflowName}</p>
        </div>

        <Select
          label="Version"
          options={versions}
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
        />

        <div className="space-y-1">
          <label className="text-sm font-medium text-content-primary">Input JSON</label>
          <CodeEditor
            value={inputJson}
            onChange={(val) => {
              setInputJson(val);
              setJsonError(null);
            }}
            language="json"
            minLines={6}
          />
          {jsonError && <p className="text-xs text-status-danger">{jsonError}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Play}
            onClick={handleStart}
            loading={startRun.isPending}
          >
            Start Run
          </Button>
        </div>
      </div>
    </Modal>
  );
};

StartRunDialog.displayName = 'StartRunDialog';

export default StartRunDialog;
