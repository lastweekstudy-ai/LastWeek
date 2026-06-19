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
      ],
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('mermaid')) return undefined;
          if (id.includes('react-pdf') || id.includes('pdfjs-dist')) return 'vendor-pdf';
          if (id.includes('cytoscape')) return 'vendor-cytoscape';
          if (id.includes('dagre') || id.includes('graphlib') || id.includes('elkjs')) return 'vendor-graph-layout';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (
            id.includes('katex') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('react-markdown') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast') ||
            id.includes('unist') ||
            id.includes('unified') ||
            id.includes('vfile') ||
            id.includes('property-information') ||
            id.includes('entities') ||
            id.includes('decode-named-character-reference') ||
            id.includes('parse-entities') ||
            id.includes('space-separated-tokens') ||
            id.includes('comma-separated-tokens') ||
            id.includes('trim-lines') ||
            id.includes('trough') ||
            id.includes('zwitch')
          ) return 'vendor-markdown';
          if (id.includes('appwrite')) return 'vendor-appwrite';
          if (id.includes('@aws-sdk') || id.includes('@smithy')) return 'vendor-aws';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'vendor-monaco';
          if (id.includes('@paddle')) return 'vendor-paddle';
          if (id.includes('@svgdotjs')) return 'vendor-svg';
          if (id.includes('date-fns')) return 'vendor-date';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';

          return 'vendor';
        },
      },
    }
  },
  server: {
    // Serve node_modules for PDF worker access
    middlewares: []
  }
})
