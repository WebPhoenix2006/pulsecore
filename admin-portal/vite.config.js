import { defineConfig } from 'vite';

export default defineConfig({
  cacheDir: 'C:/temp/vite-cache',
  optimizeDeps: {
    force: true
  },
  server: {
    fs: {
      strict: false
    }
  }
});