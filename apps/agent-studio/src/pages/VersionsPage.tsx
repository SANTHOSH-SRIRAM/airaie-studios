import React, { useState } from 'react';
import AgentVersionsList from '@components/versions/AgentVersionsList';
import PromptDiff from '@components/versions/PromptDiff';
import ABEvalPanel from '@components/versions/ABEvalPanel';

type View = 'list' | 'diff' | 'ab';

export default function VersionsPage() {
  const [view, setView] = useState<View>('list');
  const [diffVersions, setDiffVersions] = useState<[number, number] | null>(null);
  const [abVersions, setAbVersions] = useState<[number, number] | null>(null);

  const handleDiff = (a: number, b: number) => {
    setDiffVersions([a, b]);
    setView('diff');
  };

  const handleABEval = (a: number, b: number) => {
    setAbVersions([a, b]);
    setView('ab');
  };

  if (view === 'diff' && diffVersions) {
    return (
      <div className="p-6 h-full">
        <PromptDiff
          versionA={diffVersions[0]}
          versionB={diffVersions[1]}
          onBack={() => setView('list')}
          className="h-full"
        />
      </div>
    );
  }

  if (view === 'ab' && abVersions) {
    return (
      <div className="p-6 h-full">
        <ABEvalPanel
          versionA={abVersions[0]}
          versionB={abVersions[1]}
          onBack={() => setView('list')}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AgentVersionsList onDiff={handleDiff} onABEval={handleABEval} />
    </div>
  );
}
