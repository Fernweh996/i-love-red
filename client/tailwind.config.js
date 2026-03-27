/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rise: '#ef4444',    // 红色 = 涨
        fall: '#22c55e',    // 绿色 = 跌
        flat: '#8e8e93',    // iOS 灰色 = 平
        ios: {
          bg: '#F2F2F7',        // iOS system grouped background
          card: '#FFFFFF',
          blue: '#007AFF',      // iOS system blue
          gray: '#8E8E93',      // iOS secondary label
          separator: '#C6C6C8', // iOS separator
          fill: '#E5E5EA',      // iOS tertiary fill
          label: '#3C3C43',     // iOS primary label (dark)
          secondary: '#3C3C4399', // iOS secondary label with alpha
        },
      },
    },
  },
  plugins: [],
};
