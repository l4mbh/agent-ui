import { defineConfig } from '@playwright/test'

// R1–R15 are measured at four widths, light and dark. System Chrome avoids a browser download.
const widths = [360, 768, 1280, 1920] as const
const schemes = ['light', 'dark'] as const

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', channel: 'chrome' },
  webServer: {
    command: 'npm run build:site && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false, // a leftover preview on 4173 would serve a stale dist
    timeout: 120_000,
  },
  projects: widths.flatMap((width) =>
    schemes.map((colorScheme) => ({
      name: `${width}-${colorScheme}`,
      use: { viewport: { width, height: width < 768 ? 640 : 900 }, colorScheme },
    })),
  ),
})
