import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/board-studio/vitest.config.ts',
      'apps/workflow-studio/vite.config.ts',
      'apps/agent-studio/vitest.config.ts',
      'packages/shared',
    ],
  },
});
