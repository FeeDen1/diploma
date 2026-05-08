/** @type {import('tailwindcss').Config} */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: withAlpha('--color-background'),
        surface: withAlpha('--color-surface'),
        'surface-secondary': withAlpha('--color-surface-secondary'),
        border: withAlpha('--color-border'),
        'text-primary': withAlpha('--color-text-primary'),
        'text-secondary': withAlpha('--color-text-secondary'),
        'text-muted': withAlpha('--color-text-muted'),
        primary: withAlpha('--color-primary'),
        'primary-soft': withAlpha('--color-primary-soft'),
        success: withAlpha('--color-success'),
        warning: withAlpha('--color-warning'),
        error: withAlpha('--color-error'),
      },
    },
  },
  plugins: [],
};
