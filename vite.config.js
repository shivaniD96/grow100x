import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    // Proxy API requests to Vercel dev server during local development
    // Run with: vercel dev (instead of npm run dev)
    // This ensures the serverless functions work locally
  },
})
