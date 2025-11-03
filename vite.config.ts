import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: command === 'serve' ? {
      '/api': {
        target: 'https://garage-backend-production-ee79.up.railway.app/',
        changeOrigin: true,
        secure: true
      }
    } : undefined
  },
  build: {
    sourcemap: true
  }
}));
