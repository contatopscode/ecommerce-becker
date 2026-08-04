import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        becker: {
          purple: '#3B2DA8',
          'purple-deep': '#2A1F7A',
          'purple-soft': '#F2EFFC',
          orange: '#FF6B35',
          'orange-soft': '#FFF1EA',
          blue: '#0EA5E9',
          ink: '#0B0F1A',
          slate: '#64748B',
          cream: '#FAF8F5',
          line: '#E8E5F0',
        },
        eco: {
          50: '#E7F8EE',
          100: '#D1F0DD',
          500: '#16A34A',
          600: '#15803D',
          700: '#166534',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui'],
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(59, 45, 168, 0.18)',
        pop: '0 18px 50px -12px rgba(59, 45, 168, 0.28)',
        card: '0 4px 18px -6px rgba(15, 23, 42, 0.10)',
      },
    },
  },
  plugins: [],
};

export default config;
