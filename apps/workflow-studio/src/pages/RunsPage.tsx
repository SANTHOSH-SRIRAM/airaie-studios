import React, { useState, useMemo } from 'react';
import type { KernelNodeRun } from '@airaie/shared';
import { useRunLogs } from '@hooks/useRuns';
import { useWorkflowVersions } from '@hooks/useWorkflows';
import { useUIStore } from '@store/uiStore';
import RunsListView from '@components/runs/RunsListView';
import RunDetailView from '@components/runs/RunDetailView';
import RunLogs from '@components/runs/RunLogs';
import RunArtifactsPanel from '@components/runs/RunArtifactsPanel';
import RunCostBreakdown from '@components/runs/RunCostBreakdown';
import StartRunDialog from '@components/runs/StartRunDialog';

export default function RunsPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);

  const workflowId = useUIStore((s) => s.workflowId);
  const workflowName = useUIStore((s) => s.workflowName);
  const { data: versions } = useWorkflowVersions(workflowId);

  const versionOptions = useMemo(() => {
    if (!versions) return [];
    return versions
      .filter((v) => v.status === 'compiled' || v.status === 'published')
      .map((v) => ({ value: String(v.version), label: `v${v.version} (${v.status})` }));
  }, [versions]);

  if (selectedRunId) {
    return (
      <RunDetailView
        runId={selectedRunId}
        onBack={() => setSelectedRunId(null)}
        logsPanel={<RunLogs runId={selectedRunId} isActive={true} />}
        artifactsPanel={<RunArtifactsPanel runId={selectedRunId} />}
        costPanel={<RunCostBreakdownWrapper runId={selectedRunId} />}
      />
    );
  }

  return (
    <div className="p-6">
      <RunsListView
        onSelectRun={setSelectedRunId}
        onStartRun={() => setShowStartDialog(true)}
      />
      {showStartDialog && (
        <StartRunDialog
          open={showStartDialog}
          onClose={() => setShowStartDialog(false)}
          workflowId={workflowId}
          workflowName={workflowName || 'Workflow'}
          versions={versionOptions}
          onRunCreated={(id) => setSelectedRunId(id)}
        />
      )}
    </div>
  );
}

function RunCostBreakdownWrapper({ runId }: { runId: string }) {
  const { data: nodeRuns } = useRunLogs(runId);
  return <RunCostBreakdown nodeRuns={(nodeRuns as KernelNodeRun[]) ?? []} />;
}
