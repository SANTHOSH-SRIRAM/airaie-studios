import React, { useState } from 'react';
import VersionsList from '@components/versions/VersionsList';
import VersionDiff from '@components/versions/VersionDiff';

type View = 'list' | 'diff';

export default function VersionsPage() {
  const [view, setView] = useState<View>('list');
  const [diffVersions, setDiffVersions] = useState<[number, number] | null>(null);

  const handleDiff = (a: number, b: number) => {
    setDiffVersions([a, b]);
    setView('diff');
  };

  if (view === 'diff' && diffVersions) {
    return (
      <div className="p-6 h-full">
        <VersionDiff
          versionA={diffVersions[0]}
          versionB={diffVersions[1]}
          onBack={() => setView('list')}
          className="h-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <VersionsList onDiff={handleDiff} />
    </div>
  );
}
