/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
   "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
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
        'card-pattern': "url('/assets/img/card-background.png')",
      },
    },
  },
  plugins: [],
  // Ensure Tailwind doesn't remove used classes
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