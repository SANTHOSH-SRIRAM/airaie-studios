// ============================================================
// Viewer Registration — side-effect module
// Phase 3: image, table, document replaced with real viewers.
// Phase 6: 3d stub replaced with real ThreeDViewer (three.js + R3F).
// Phase 7+ will replace remaining stubs.
// ============================================================

import { registerViewer } from './viewer-registry';

// Real viewers (Phase 3)
registerViewer('image', () => import('../viewers/ImageViewer'));
registerViewer('table', () => import('../viewers/DataTableViewer'));
registerViewer('document', () => import('../viewers/PdfViewer'));

// Real viewer (Phase 6)
registerViewer('3d', () => import('../viewers/ThreeDViewer'));
registerViewer('code', () => import('./stubs/CodeStubViewer'));
registerViewer('download', () => import('./stubs/DownloadStubViewer'));
