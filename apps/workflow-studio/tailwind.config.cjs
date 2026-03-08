const uiPreset = require('@airaie/ui/tokens/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [uiPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './index.html',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/shell/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: { bg: '#f8fafc', grid: '#e2e8f0', 'grid-major': '#cbd5e1' },
        node: {
          control: '#f59e0b',
          board: '#1e40af',
          agent: '#8b5cf6',
          human: '#22c55e',
          system: '#06b6d4',
        },
        selection: '#1e40af',
      },
    },
  },
  plugins: [],
};
