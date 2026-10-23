import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// '@/registry' must come before '@': the first matching alias wins.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: '@/registry', replacement: path.resolve(import.meta.dirname, 'registry') },
      { find: '@', replacement: path.resolve(import.meta.dirname, 'src') },
    ],
  },
})
