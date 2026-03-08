import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { Badge, Select } from '@airaie/ui';
import { useWorkflows } from '@hooks/useWorkflows';
import TriggersConfig from '@components/triggers/TriggersConfig';

export default function TriggersPage() {
  const { data: rawWorkflows } = useWorkflows();
  const workflows = Array.isArray(rawWorkflows) ? rawWorkflows : [];
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

  const workflowOptions = workflows.map((wf) => ({
    value: wf.id,
    label: wf.name,
  }));

  return (
    <div className="p-6 space-y-6 min-h-full bg-grid">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-content-primary">Triggers</h1>
          <p className="text-sm text-content-secondary mt-1">
            Configure automated triggers for your workflows.
          </p>
        </div>
      </div>

      {/* Workflow selector */}
      {workflowOptions.length > 0 && (
        <Select
          label="Workflow"
          options={[{ value: '', label: 'Select a workflow...' }, ...workflowOptions]}
          value={selectedWorkflowId}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
        />
      )}

      {/* Triggers config */}
      <TriggersConfig workflowId={selectedWorkflowId || undefined} />
    </div>
  );
}
