/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          light: 'var(--color-primary-light)',
          subtle: 'var(--color-primary-subtle)',
          foreground: 'var(--color-primary-foreground)',
        },
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
          subtle: 'var(--color-surface-subtle)',
        },
        text: {
          main: 'var(--color-text-main)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
          subtle: 'var(--color-border-subtle)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
          foreground: 'var(--color-success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
          foreground: 'var(--color-warning-foreground)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          hover: 'var(--color-danger-hover)',
          bg: 'var(--color-danger-bg)',
          foreground: 'var(--color-danger-foreground)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-base)'],
        heading: ['var(--font-family-heading)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      spacing: {
        'token-xs': 'var(--spacing-xs)',
        'token-sm': 'var(--spacing-sm)',
        'token-md': 'var(--spacing-md)',
        'token-lg': 'var(--spacing-lg)',
        'token-xl': 'var(--spacing-xl)',
        'token-2xl': 'var(--spacing-2xl)',
      },
    },
  },
  plugins: [],
};
