import { expect, test, type Locator } from '@playwright/test'
import { clippedWithoutTitle, horizontalScroll, overflowing, overlappingText, settle } from '../../registry/testing/rules'

// ?actions=0 is the header of an app on the v0.1.0 wiring (no `actions`); its markup is pinned in tests/unit/app-shell.test.tsx.
test('AppShell without actions — header fits, user name truncates, no sideways scroll', async ({ page }) => {
  await page.goto('/stress?actions=0')
  await expect(page.getByRole('banner').getByRole('switch')).toHaveCount(0)
  await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
  expect(await overflowing(page, 'header')).toEqual([])
  expect(await horizontalScroll(page)).toBe(false)
  await expect(page.getByRole('link', { name: /stress|壓力/i })).toHaveAttribute('aria-current', 'page')
  // R4: the long user name is really cut, and the cut text carries the full name.
  const name = 'someone.with.a.very.long.alias@example.com'
  const user = page.locator('header').getByText(name)
  expect(await user.evaluate((e) => e.scrollWidth > e.clientWidth + 1)).toBe(true)
  await expect(user).toHaveAttribute('title', name)
  expect(await clippedWithoutTitle(page, 'header')).toEqual([])
})

// With brand, four tabs (one with a count), theme + language switches and a long user name, in both languages:
// nothing spills, the switches and the user menu stay on screen, and the tabs keep usable room.
for (const locale of ['en', 'zh-TW'] as const) {
  test(`AppShell with actions — header fits and every control is reachable (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    await settle(page)
    const header = page.getByRole('banner')
    expect(await overflowing(page, 'header')).toEqual([])
    expect(await clippedWithoutTitle(page, 'header')).toEqual([])
    expect(await overlappingText(page, 'header')).toEqual([])
    expect(await horizontalScroll(page)).toBe(false)
    const vw = page.viewportSize()!.width
    const onScreen = async (control: Locator) => {
      await expect(control).toBeVisible()
      const b = (await control.boundingBox())!
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.x + b.width).toBeLessThanOrEqual(vw)
    }
    for (const control of [header.getByRole('switch'), header.getByRole('button', { name: /^(Language|語言)$/ }), header.getByText('someone.with.a.very.long.alias@example.com')]) await onScreen(control)
    // Below 640 px the tabs take their own full-width row; above, they still get room for at least two tabs.
    const navWidth = (await header.getByRole('navigation').boundingBox())!.width
    expect(navWidth).toBeGreaterThanOrEqual(vw < 640 ? vw - 32 : 240)
    // The last tab is reachable by scrolling the tab row, never the page.
    await header.getByRole('link').last().scrollIntoViewIfNeeded()
    await onScreen(header.getByRole('link').last())
    expect(await horizontalScroll(page)).toBe(false)
  })
}
