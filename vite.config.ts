import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` with `import.meta.url` to get the current directory path in an ES module environment, which resolves the "Cannot find name '__dirname'" error.
      '@': path.resolve(new URL(import.meta.url).pathname, '..', 'src'),
    },
  },
})