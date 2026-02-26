import React, { useState } from 'react';
import PlaygroundLayout from '@components/playground/PlaygroundLayout';
import AgentChat from '@components/playground/AgentChat';
import ProposalInspector from '@components/playground/ProposalInspector';

export default function PlaygroundPage() {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  return (
    <PlaygroundLayout
      chatPanel={
        <AgentChat
          selectedProposalId={selectedProposalId}
          onSelectProposal={setSelectedProposalId}
        />
      }
      inspectorPanel={
        <ProposalInspector selectedProposalId={selectedProposalId} />
      }
    />
  );
}
