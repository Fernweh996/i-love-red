/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rise: '#ef4444',    // 红色 = 涨
        fall: '#22c55e',    // 绿色 = 跌
        flat: '#6b7280',    // 灰色 = 平
        morandi: {
          bg: '#FAF9F7',
          pink: '#D4A9A8',
          green: '#A8BFA8',
          blue: '#9BB5C9',
          card: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
};
