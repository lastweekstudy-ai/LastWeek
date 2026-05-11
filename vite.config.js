import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  optimizeDeps: {
    // Don't pre-bundle react-pdf to avoid version conflicts
    exclude: ['react-pdf'],
    // Pre-bundle warning to handle CommonJS properly
    include: ['warning']
  },
  build: {
    rollupOptions: {
      external: [
        /pdf\.worker/
      ]
    }
  },
  server: {
    // Serve node_modules for PDF worker access
    middlewares: []
  }
})
