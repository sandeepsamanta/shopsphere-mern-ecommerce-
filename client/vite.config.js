import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, /api calls are proxied to the Express server, so no CORS setup is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.API_PROXY_TARGET || 'http://localhost:5000' },
  },
  test: { environment: 'node' },
});
