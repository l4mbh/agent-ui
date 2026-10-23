import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@/registry', replacement: path.resolve(import.meta.dirname, 'registry') },
      { find: '@', replacement: path.resolve(import.meta.dirname, 'src') },
    ],
  },
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.{ts,tsx}'] },
})
