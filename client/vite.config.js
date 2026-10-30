import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } }, // dev: same-origin calls reach the API
  test: { environment: 'jsdom', globals: true },
});
