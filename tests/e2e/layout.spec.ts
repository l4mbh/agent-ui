import { expect, test } from '@playwright/test'
import { clippedWithoutTitle, horizontalScroll, overflowing, overlappingText, settle } from '../../registry/testing/rules'

for (const locale of ['en', 'zh-TW'] as const) {
  test(`R1 R4 R6 R11 — no spill, no overlap, cut text has a title (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    await settle(page)
    await expect(page.getByTestId('section-text-layout')).toBeVisible()
    expect(await overflowing(page)).toEqual([])
    expect(await overlappingText(page)).toEqual([])
    expect(await clippedWithoutTitle(page)).toEqual([])
    expect(await horizontalScroll(page)).toBe(false)
  })
}
