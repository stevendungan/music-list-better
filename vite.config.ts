import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/client',
  server: {
    proxy: {
      '/api/': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true
  }
})
