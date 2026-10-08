import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // three.js alone is ~600 kB; one bundle is fine for this app.
  build: { chunkSizeWarningLimit: 1000 },
  test: { environment: 'node' },
});
