/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0d9488',
          'primary-dark': '#0f766e',
          secondary: '#3b5fa8',
          'secondary-dark': '#334f8f',
        },
        surface: {
          bg: '#f1f5f9',
          card: '#ffffff',
          border: '#e2e8f0',
          hover: '#f8fafc',
        },
        content: {
          primary: '#1e293b',
          secondary: '#475569',
          tertiary: '#64748b',
          muted: '#94a3b8',
        },
        sidebar: {
          bg: '#ffffff',
          hover: '#f1f5f9',
          active: '#3b5fa8',
          text: '#475569',
          'text-active': '#3b5fa8',
        },
        status: {
          success: '#22c55e',
          'success-light': '#dcfce7',
          warning: '#f59e0b',
          'warning-light': '#fef3c7',
          danger: '#ef4444',
          'danger-light': '#fee2e2',
          info: '#3b82f6',
          'info-light': '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
      spacing: {
        sidebar: '230px',
        'sidebar-collapsed': '72px',
        header: '52px',
      },
    },
  },
};
