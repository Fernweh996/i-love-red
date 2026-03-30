/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        rise: '#E8453C',
        fall: '#34A853',
        flat: '#999999',
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#888888',
          faint: '#BBBBBB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#FAFAFA',
        },
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
};
