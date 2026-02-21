import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ProofOfConcept/',
  server: {
    watch: {
      usePolling: true, 
    },
    host: true,
    strictPort: true,
    port: 5173,
  }
})