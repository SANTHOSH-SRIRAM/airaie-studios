// ============================================================
// Stub Viewer Registration — side-effect module
// Import this module to register all 6 stub viewers.
// Phases 3-7 call registerViewer() to replace these stubs
// with real viewer implementations.
// ============================================================

import { registerViewer } from './viewer-registry';

registerViewer('image', () => import('./stubs/ImageStubViewer'));
registerViewer('3d', () => import('./stubs/ThreeDStubViewer'));
registerViewer('document', () => import('./stubs/DocumentStubViewer'));
registerViewer('table', () => import('./stubs/TableStubViewer'));
registerViewer('code', () => import('./stubs/CodeStubViewer'));
registerViewer('download', () => import('./stubs/DownloadStubViewer'));
