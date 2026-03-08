// Re-export the shared API client — all modules import from here.
// The shared client handles JWT auth, project ID, and error transforms.

import { apiClient, setProjectId } from '@airaie/shared';

// Set the default project for board-studio
setProjectId(localStorage.getItem('airaie_project_id') || 'prj_default');

export default apiClient;
