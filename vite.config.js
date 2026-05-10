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
  build: {
    rollupOptions: {
      external: [
        /pdf\.worker/
      ]
    }
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
})
