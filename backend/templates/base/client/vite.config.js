import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// envDir '..' lets the client read VITE_* keys from the single root .env
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
