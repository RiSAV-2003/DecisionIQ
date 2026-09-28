/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#030712',
          darker: '#01040a',
          card: 'rgba(11, 19, 43, 0.6)',
          elevated: 'rgba(17, 28, 60, 0.75)',
          sidebar: 'rgba(7, 13, 30, 0.95)',
        },
        cyber: {
          cyan: '#00f0ff',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          purple: '#a855f7',
          magenta: '#ec4899',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        },
        dark: {
          950: '#01040a',
          900: '#030712',
          850: '#070d1e',
          800: '#0b132b',
          700: '#111c3c',
          600: '#1e293b',
          500: '#334155',
          400: '#64748b',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        script: ['var(--font-kalam)', 'handwriting', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.4)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glow-magenta': '0 0 25px -5px rgba(236, 72, 153, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.5)',
        'glass-panel': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 50%, #8b5cf6 100%)',
        'btn-gradient': 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 50%, #8b5cf6 100%)',
        'btn-gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
        'cyber-gradient-soft': 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(139,92,246,0.15) 50%, rgba(236,72,153,0.15) 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'scan-line': 'scanLine 4s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
};
