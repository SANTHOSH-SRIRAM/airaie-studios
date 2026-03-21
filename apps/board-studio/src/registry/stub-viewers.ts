// ============================================================
// Viewer Registration — side-effect module
// Phase 3: image, table, document replaced with real viewers.
// Phases 6-7 will replace 3d stub with real implementations.
// ============================================================

import { registerViewer } from './viewer-registry';

// Real viewers (Phase 3)
registerViewer('image', () => import('../viewers/ImageViewer'));
registerViewer('table', () => import('../viewers/DataTableViewer'));
registerViewer('document', () => import('../viewers/PdfViewer'));

// Remaining stubs (Phases 6-7+)
registerViewer('3d', () => import('./stubs/ThreeDStubViewer'));
registerViewer('code', () => import('./stubs/CodeStubViewer'));
registerViewer('download', () => import('./stubs/DownloadStubViewer'));
