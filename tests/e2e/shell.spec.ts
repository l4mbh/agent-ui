import { expect, test } from '@playwright/test'
import { clippedWithoutTitle, horizontalScroll, overflowing } from '../../registry/testing/rules'

test('AppShell — header fits, user name truncates, no sideways scroll', async ({ page }) => {
  await page.goto('/stress')
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
