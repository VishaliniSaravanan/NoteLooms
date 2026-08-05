import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Raise chunk warning threshold slightly (default 500kb is too noisy for React apps)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split heavy libraries into separate cached chunks
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'motion':        ['framer-motion'],
          'math':          ['katex', 'react-katex'],
          'flow':          ['reactflow'],
          'd3':            ['d3', 'react-d3-tree'],
        },
      },
    },
    // Minify with esbuild (default) — fast and effective
    minify: 'esbuild',
    // Source maps off in production = smaller output
    sourcemap: false,
    // Drop console.log in production
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
  },
})
