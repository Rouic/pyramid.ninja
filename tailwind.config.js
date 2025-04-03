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
        display: [
          '"Press Start 2P"',
          'monospace'
        ],
        game: [
          'Oswald',
          'Arial Black',
          'Impact',
          'Arial',
          'sans-serif',
        ]
      },
      colors: {
        // Balatro-inspired colors
        'game': {
          'bg': '#1a0f26',
          'card': '#191230',
          'felt': '#271847',
          'accent': '#ff5722',
          'highlight': '#ffc107',
          'neon': {
            'blue': '#3287fc',
            'red': '#ff2158',
            'green': '#32fc58',
            'purple': '#9932fc',
            'yellow': '#fcde32'
          }
        }
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        glow: {
          '0%': { 
            'text-shadow': '0 0 5px rgba(255,255,255,0.7), 0 0 10px rgba(255,255,255,0.5), 0 0 15px rgba(255,179,0,0.5), 0 0 20px rgba(255,179,0,0.3)'
          },
          '100%': { 
            'text-shadow': '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(255,255,255,0.7), 0 0 30px rgba(255,179,0,0.7), 0 0 40px rgba(255,179,0,0.5)'
          }
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      },
      transitionProperty: {
        'width': 'width',
        'height': 'height',
      },
      backgroundImage: {
        'card-pattern': "url('/images/card-pattern.svg')",
        'felt-texture': "linear-gradient(to bottom right, rgba(39, 24, 71, 0.8), rgba(39, 24, 71, 1)), url('/images/card-pattern.svg')",
        'neon-gradient': "linear-gradient(to right, #3287fc, #9932fc, #ff2158)",
      },
      boxShadow: {
        'neon-blue': '0 0 5px #3287fc, 0 0 10px #3287fc',
        'neon-red': '0 0 5px #ff2158, 0 0 10px #ff2158',
        'neon-green': '0 0 5px #32fc58, 0 0 10px #32fc58',
        'neon-yellow': '0 0 5px #fcde32, 0 0 10px #fcde32',
        'neon-purple': '0 0 5px #9932fc, 0 0 10px #9932fc',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)'
      }
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
      pattern: /(bg|text|border)-(blue|gray|rose|red|green|indigo|purple|yellow)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Game colors
    {
      pattern: /(bg|text|border)-(game)-(bg|card|felt|accent|highlight)/,
    },
    // Neon colors
    {
      pattern: /(bg|text|border|shadow)-(neon)-(blue|red|green|purple|yellow)/,
    },
    // Common utilities
    {
      pattern: /(p|m|px|py|mx|my)-(0|1|2|3|4|5|6|8|10|12|16|20|24)/,
    },
    {
      pattern: /(flex|grid|block|hidden|relative|absolute|fixed|rounded|shadow)/,
    },
    {
      pattern: /(hover|focus|active):.+/,
    }
  ]
};