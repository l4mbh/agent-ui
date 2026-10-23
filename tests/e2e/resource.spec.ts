import { expect, test } from '@playwright/test'
import { layoutShift, trackLayoutShift } from '../../registry/testing/rules'

test.describe('R8 R10', () => {
  test.beforeEach(({}, info) => test.skip(!['1280-light', '360-light'].includes(info.project.name)))

  test('slow load: skeleton first, then data, no layout shift', async ({ page }) => {
    await trackLayoutShift(page)
    await page.goto('/stress?delay=2000')
    // Scroll the section into view at once: a shift only counts where the user can see it.
    await page.getByTestId('resource-after').scrollIntoViewIfNeeded()
    await expect(page.getByTestId('resource').locator('[aria-busy=true]')).toBeVisible()
    await expect(page.getByTestId('resource').getByText('10/23 14:00–14:30')).toBeVisible({ timeout: 5000 })
    expect(await layoutShift(page)).toBeLessThan(0.001)
  })

  test('failure: friendly sentence and code, never the raw error', async ({ page }) => {
    await page.goto('/stress?fail=SLOTS_FAILED&locale=zh-TW')
    const alert = page.getByTestId('resource').getByRole('alert')
    await expect(alert).toContainText('找不到空檔')
    await expect(alert).toContainText('SLOTS_FAILED')
  })

  test('unknown code falls back to the generic sentence', async ({ page }) => {
    await page.goto('/stress?fail=WHATEVER')
    await expect(page.getByTestId('resource').getByRole('alert')).toContainText('Something went wrong')
  })

  test('empty: says what to do next', async ({ page }) => {
    await page.goto('/stress?empty=1')
    await expect(page.getByTestId('resource')).toContainText('Widen the range')
  })
})
