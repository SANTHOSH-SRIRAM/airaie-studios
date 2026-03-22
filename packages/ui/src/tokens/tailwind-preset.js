/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        /* ── Brand (Black + White — no color accent) ──────── */
        brand: {
          primary:        '#0a0a0a',
          'primary-hover': '#1a1a1a',
          'primary-active': '#2a2a2a',
          'primary-muted': '#f7f8fa',
          danger:         '#da1e28',
          'danger-hover':  '#a2191f',
        },

        /* ── Surfaces ──────────────────────────────────────── */
        surface: {
          bg:     '#ffffff',
          card:   '#ffffff',
          layer:  '#f7f8fa',
          border: '#e2e5ea',
          hover:  '#f5f5f5',
          active: '#e8e8e8',
        },

        /* ── Card ──────────────────────────────────────────── */
        card: {
          bg:            '#ffffff',
          header:        '#f7f8fa',
          border:        '#e2e5ea',
          'border-inner': '#eef0f3',
        },

        /* ── Content (text) ────────────────────────────────── */
        content: {
          primary:     '#0a0a0a',
          secondary:   '#3d3d3d',
          helper:      '#6b6b6b',
          placeholder: '#a0a0a0',
          disabled:    '#c6cbd1',
          inverse:     '#ffffff',
        },

        /* ── Sidebar (dark) ────────────────────────────────── */
        sidebar: {
          bg:              '#0a0a0a',
          hover:           '#1a1a1a',
          text:            '#b0b0b0',
          'text-active':   '#ffffff',
          icon:            '#808080',
          border:          '#2a2a2a',
          section:         '#606060',
          'active-border': '#0a0a0a',
        },

        /* ── Border ────────────────────────────────────────── */
        border: {
          DEFAULT: '#e2e5ea',
          subtle:  '#eef0f3',
          strong:  '#808080',
          focus:   '#0a0a0a',
        },

        /* ── Status ────────────────────────────────────────── */
        status: {
          success:       '#24a148',
          'success-bg':  '#defbe6',
          'success-text': '#198038',
          warning:       '#f1c21b',
          'warning-bg':  'rgba(253, 209, 58, 0.15)',
          danger:        '#da1e28',
          'danger-bg':   '#fff1f1',
          'danger-text':  '#a2191f',
          info:          '#3d3d3d',
          'info-bg':     '#f7f8fa',
          'info-text':   '#0a0a0a',
        },

        /* ── Gray scale (neutral black) ────────────────────── */
        gray: {
          10:  '#f7f8fa',
          20:  '#e8ecf0',
          30:  '#c6cbd1',
          40:  '#a0a0a0',
          50:  '#808080',
          60:  '#6b6b6b',
          70:  '#3d3d3d',
          80:  '#2a2a2a',
          90:  '#1a1a1a',
          100: '#0a0a0a',
        },

        /* ── Focus ─────────────────────────────────────────── */
        focus: '#0a0a0a',
      },

      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'monospace'],
      },

      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem',     letterSpacing: '0.32px' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem',  letterSpacing: '0.16px' }],
        'base': ['1rem',     { lineHeight: '1.375rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.5rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
      },

      boxShadow: {
        'xs':         '0 1px 2px rgba(0, 0, 0, 0.04)',
        'card':       '0 1px 3px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'elevated':   '0 4px 16px rgba(0, 0, 0, 0.08)',
        'dropdown':   '0 8px 24px rgba(0, 0, 0, 0.1)',
        'raised':     '0 8px 24px rgba(0, 0, 0, 0.1)',
      },

      spacing: {
        sidebar:            '256px',
        'sidebar-collapsed': '48px',
        header:             '48px',
      },

      borderRadius: {
        'none': '0',
        'sm':   '2px',
        'md':   '6px',
        'lg':   '8px',
        'xl':   '12px',
      },

      animation: {
        'fade-in':  'fadeIn 100ms ease-out',
        'slide-in': 'slideIn 100ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'skeleton': 'skeletonPulse 1s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn:      { '0%': { transform: 'translateY(-8px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        skeletonPulse:{ '0%': { opacity: '0.3' }, '100%': { opacity: '1' } },
      },
    },
  },
};
