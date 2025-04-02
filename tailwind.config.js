/** @type {import('tailwindcss').Config} */
module.exports = {
  // Using 'all' here to make sure Tailwind scans all files
  content: [
    './**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
    '/src/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/contexts/*.{js,jsx,ts,tsx}',
    './src/hooks/*.{js,jsx,ts,tsx}',
    './src/lib/*.{js,jsx,ts,tsx}',
    './src/pages/**/*.{js,jsx,ts,tsx}',
    './src/pages/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Roboto',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      transitionProperty: {
        'width': 'width',
        'height': 'height',
      },
      backgroundImage: {
        'card-pattern': "url('/images/card-background.png')",
      },
    },
  },
  // Important in v4: make sure tailwind checks for any styles
  // being used dynamically via string interpolation
  future: {
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
  },
  // Keep the safelist to ensure all needed classes are included
  safelist: [
    // Common colors
    {
      pattern: /(bg|text|border)-(blue|gray|rose|red|green|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Common utilities
    {
      pattern: /(p|m|px|py|mx|my)-(0|1|2|3|4|5|6|8|10|12)/,
    },
    {
      pattern: /(flex|grid|block|hidden|relative|absolute|fixed|rounded|shadow)/,
    },
    {
      pattern: /(hover|focus|active):.+/,
    }
  ]
};