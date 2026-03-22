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
        canvas: { bg: '#ffffff', grid: '#e8ecf0', 'grid-major': '#c6cbd1' },
        node: {
          control: '#f1c21b',
          board: '#0a0a0a',
          agent: '#6b6b6b',
          human: '#24a148',
          system: '#3d3d3d',
        },
        selection: '#0a0a0a',
      },
    },
  },
  plugins: [],
};
