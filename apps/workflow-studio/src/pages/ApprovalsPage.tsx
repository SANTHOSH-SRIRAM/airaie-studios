import React, { useState } from 'react';
import ApprovalQueue from '@components/approvals/ApprovalQueue';
import GateDetail from '@components/approvals/GateDetail';

export default function ApprovalsPage() {
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  if (selectedGateId) {
    return (
      <div className="p-6 h-full">
        <GateDetail
          gateId={selectedGateId}
          onBack={() => setSelectedGateId(null)}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ApprovalQueue onSelectGate={setSelectedGateId} />
    </div>
  );
}
