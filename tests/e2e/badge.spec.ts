import { expect, test } from '@playwright/test'
import { widths } from '../../registry/testing/rules'

for (const locale of ['en', 'zh-TW'] as const) {
  test(`R3 — every badge of one set has the same width (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    const w = await widths(page.getByTestId('badge-set-meeting').locator('[data-slot=status-badge]'))
    expect(w.length).toBe(4)
    expect(new Set(w).size).toBe(1)
  })
}

test('R3 — the width does not change when the language changes', async ({ page }) => {
  const one = async (locale: string) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    return (await widths(page.getByTestId('badge-set-meeting').locator('[data-slot=status-badge]')))[0]
  }
  expect(await one('en')).toBe(await one('zh-TW'))
})

// Sizers are aria-hidden: the accessibility tree of the badge holds only the current label, not every label x every language.
test('R3 — screen readers get only the current label', async ({ page }) => {
  await page.goto('/stress?locale=en')
  await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
  const badge = page.getByTestId('badge-set-meeting').locator('[data-slot=status-badge]').first()
  await expect(badge).toMatchAriaSnapshot('- text: Asking')
})
