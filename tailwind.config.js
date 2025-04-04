/** @type {import('tailwindcss').Config} */
module.exports = {
  // Using 'all' here to make sure Tailwind scans all files
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'xxs': '375px',
        // your other breakpoints...
      },
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
        // Balatro-inspired colors with rose theme
        'game': {
          'bg': '#26101a',
          'card': '#301219',
          'felt': '#471827',
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
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-slow-reverse': 'floatReverse 7s ease-in-out infinite',
        'move-stripes': 'moveStripes 1s linear infinite'
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
        },
        floatReverse: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(10px)' },
          '100%': { transform: 'translateY(0px)' }
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        },
        moveStripes: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '20px 0' }
        }
      },
      transitionProperty: {
        'width': 'width',
        'height': 'height',
      },
      rotate: {
        '0.5': '0.5deg',
        '-0.5': '-0.5deg',
        '1': '1deg',
        '-1': '-1deg',
      },
      backgroundImage: {
        'card-pattern': "url('/images/card-pattern.svg')",
        'felt-texture': "linear-gradient(to bottom right, rgba(39, 24, 71, 0.8), rgba(39, 24, 71, 1)), url('/images/card-pattern.svg')",
        'neon-gradient': "linear-gradient(to right, #3287fc, #9932fc, #ff2158)",
      },
      boxShadow: {
        // Standard neon shadows
        'neon-blue': '0 0 5px #3287fc, 0 0 10px #3287fc',
        'neon-red': '0 0 5px #ff2158, 0 0 10px #ff2158',
        'neon-green': '0 0 5px #32fc58, 0 0 10px #32fc58',
        'neon-yellow': '0 0 5px #fcde32, 0 0 10px #fcde32',
        'neon-purple': '0 0 5px #9932fc, 0 0 10px #9932fc',
        'neon-orange': '0 0 5px #ff9933, 0 0 10px #ff9933',
        
        // Small neon shadows
        'neon-blue-sm': '0 0 3px #3287fc, 0 0 5px rgba(50, 135, 252, 0.5)',
        'neon-red-sm': '0 0 3px #ff2158, 0 0 5px rgba(255, 33, 88, 0.5)',
        'neon-green-sm': '0 0 3px #32fc58, 0 0 5px rgba(50, 252, 88, 0.5)',
        'neon-yellow-sm': '0 0 3px #fcde32, 0 0 5px rgba(252, 222, 50, 0.5)',
        'neon-purple-sm': '0 0 3px #9932fc, 0 0 5px rgba(153, 50, 252, 0.5)',
        'neon-orange-sm': '0 0 3px #ff9933, 0 0 5px rgba(255, 153, 51, 0.5)',
        
        // Large neon shadows
        'neon-blue-lg': '0 0 10px #3287fc, 0 0 15px rgba(50, 135, 252, 0.7), 0 0 20px rgba(50, 135, 252, 0.4)',
        'neon-red-lg': '0 0 10px #ff2158, 0 0 15px rgba(255, 33, 88, 0.7), 0 0 20px rgba(255, 33, 88, 0.4)',
        'neon-green-lg': '0 0 10px #32fc58, 0 0 15px rgba(50, 252, 88, 0.7), 0 0 20px rgba(50, 252, 88, 0.4)',
        'neon-yellow-lg': '0 0 10px #fcde32, 0 0 15px rgba(252, 222, 50, 0.7), 0 0 20px rgba(252, 222, 50, 0.4)',
        'neon-purple-lg': '0 0 10px #9932fc, 0 0 15px rgba(153, 50, 252, 0.7), 0 0 20px rgba(153, 50, 252, 0.4)',
        
        // Card shadows
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3)'
      }
    },
  },
  // Important in v4: make sure tailwind checks for any styles
  // being used dynamically via string interpolation
  future: {
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: false,
  }
};