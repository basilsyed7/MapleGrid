const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./index.html', './src/ts/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'space-black': '#0B0E14',
        'night-indigo': '#151226',
        'core-purple': '#6D28D9',
        'electric-violet': '#A78BFA',
        'aurora-teal': '#22D3EE',
        'starlight': '#E5E7EB'
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.25)',
        'glow-violet': '0 0 24px rgba(167,139,250,0.35)'
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        full: '9999px'
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      lineHeight: {
        heading: '1.3',
        body: '1.6'
      },
      fontSize: {
        'fs-12': '12px',
        'fs-14': '14px',
        'fs-16': '16px',
        'fs-18': '18px',
        'fs-24': '24px',
        'fs-32': '32px',
        'fs-48': '48px',
        'fs-64': '64px'
      },
      spacing: {
        'sp-4': '4px',
        'sp-8': '8px',
        'sp-12': '12px',
        'sp-16': '16px',
        'sp-24': '24px',
        'sp-32': '32px',
        'sp-48': '48px',
        'sp-64': '64px',
        'sp-96': '96px'
      },
      maxWidth: {
        content: '1200px'
      }
    }
  },
  plugins: []
};
