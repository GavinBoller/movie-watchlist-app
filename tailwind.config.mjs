// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#212529',
        primary: '#007bff',
        success: '#28a745',
        danger: '#dc3545',
      },
    },
  },
  plugins: [],
};