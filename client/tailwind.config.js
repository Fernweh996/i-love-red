/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        rise: '#D94030',
        fall: '#2E8B57',
        flat: '#9498A3',
        ink: {
          DEFAULT: '#2C2F36',
          secondary: '#9498A3',
          faint: '#B8BBC4',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          bg: '#F0F1F4',
        },
        accent: '#6B84B0',
        border: {
          DEFAULT: '#DCDFE5',
          light: '#F0F1F4',
        },
        'search-bg': '#E4E6EB',
      },
      letterSpacing: {
        label: '0.08em',
      },
    },
  },
  plugins: [],
};
