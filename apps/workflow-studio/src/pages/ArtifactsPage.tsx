import React, { useState } from 'react';
import ArtifactCatalog from '@components/artifacts/ArtifactCatalog';
import ArtifactDetail from '@components/artifacts/ArtifactDetail';
import LineageGraph from '@components/artifacts/LineageGraph';

type View = 'catalog' | 'lineage';

export default function ArtifactsPage() {
  const [view, setView] = useState<View>('catalog');
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [lineageArtifactId, setLineageArtifactId] = useState<string | null>(null);
  const [detailArtifactId, setDetailArtifactId] = useState<string | null>(null);

  const handleViewLineage = (id: string) => {
    setLineageArtifactId(id);
    setView('lineage');
  };

  if (view === 'lineage' && lineageArtifactId) {
    return (
      <div className="p-6 h-full flex flex-col">
        <button
          onClick={() => setView('catalog')}
          className="text-sm text-content-muted hover:text-content-primary mb-4 self-start"
        >
          &larr; Back to Catalog
        </button>
        <LineageGraph
          artifactId={lineageArtifactId}
          onSelectArtifact={(id) => {
            setLineageArtifactId(id);
            setDetailArtifactId(id);
          }}
          className="flex-1"
        />
        <ArtifactDetail artifactId={detailArtifactId} onClose={() => setDetailArtifactId(null)} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ArtifactCatalog
        onSelectArtifact={(id) => setDetailArtifactId(id)}
        onViewLineage={handleViewLineage}
      />
      <ArtifactDetail artifactId={detailArtifactId} onClose={() => setDetailArtifactId(null)} />
    </div>
  );
}
