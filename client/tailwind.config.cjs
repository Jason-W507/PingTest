/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        latency: {
          excellent: '#22c55e',
          good: '#84cc16',
          moderate: '#eab308',
          poor: '#f97316',
          fail: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
