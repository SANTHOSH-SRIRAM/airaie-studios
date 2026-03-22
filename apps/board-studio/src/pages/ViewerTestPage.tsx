// ============================================================
// ViewerTestPage — Standalone test for 3D and other viewers
// ============================================================
// Route: /viewer-test
// Tests ThreeDViewer with a static STL file from public/demo/

import React, { Suspense } from 'react';
import { Skeleton } from '@airaie/ui';

const ThreeDViewer = React.lazy(() => import('../viewers/ThreeDViewer'));
const DataTableViewer = React.lazy(() => import('../viewers/DataTableViewer'));

export default function ViewerTestPage() {
  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">Viewer Component Test</h1>
      <p className="text-content-tertiary">Testing viewer components with static demo files.</p>

      {/* 3D Model Viewer */}
      <div className="border border-surface-border rounded-lg overflow-hidden">
        <div className="bg-surface-hover px-4 py-2 text-sm font-semibold border-b border-surface-border">
          ThreeDViewer — bracket_assembly.stl
        </div>
        <div style={{ height: 500 }}>
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <ThreeDViewer
              url="/demo/bracket_assembly.stl"
              filename="bracket_assembly.stl"
              contentType="model/stl"
              sizeBytes={2484}
            />
          </Suspense>
        </div>
      </div>

      {/* Data Table Viewer */}
      <div className="border border-surface-border rounded-lg overflow-hidden">
        <div className="bg-surface-hover px-4 py-2 text-sm font-semibold border-b border-surface-border">
          DataTableViewer — convergence.csv
        </div>
        <div style={{ height: 400 }}>
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <DataTableViewer
              url="/demo/convergence.csv"
              filename="convergence.csv"
              contentType="text/csv"
              sizeBytes={600}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
