import { expect, test } from '@playwright/test'
import { overflowing, settle } from '../../registry/testing/rules'

test.beforeEach(({}, info) => test.skip(!['1280-light', '360-light'].includes(info.project.name)))

test('R12 — five identical toasts become one, counted', async ({ page }) => {
  await page.goto('/stress')
  await page.getByTestId('toast-5').click()
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(1)
  await expect(page.locator('[data-sonner-toast]')).toContainText('+4')
})

test('R12 — never more than three on screen', async ({ page }) => {
  await page.goto('/stress')
  await page.getByTestId('toast-different').click()
  await expect(page.locator('[data-sonner-toast][data-visible=true]')).toHaveCount(3)
})

test('R12 — the count starts again after the toast is closed', async ({ page }) => {
  await page.goto('/stress')
  await page.getByTestId('toast-2').click()
  const toast = page.locator('[data-sonner-toast]')
  await expect(toast).toContainText('+1')
  await toast.hover()
  await toast.getByRole('button', { name: 'Close' }).click()
  await expect(toast).toHaveCount(0)
  await page.getByTestId('toast-1').click()
  await expect(toast).toHaveCount(1)
  await expect(toast).toContainText('Saved')
  await expect(toast).not.toContainText('+')
})

test('R15 — an error toast stays until closed, and can be closed', async ({ page }) => {
  await page.goto('/stress')
  await page.getByTestId('toast-error').click()
  const toast = page.locator('[data-sonner-toast]')
  await page.waitForTimeout(6000)
  await expect(toast).toBeVisible()
  await toast.hover()
  await toast.getByRole('button').first().click()
  await expect(toast).toHaveCount(0)
})

test('R15 — the close button is named in the page language', async ({ page }) => {
  await page.goto('/stress?locale=zh-TW')
  await page.getByTestId('toast-error').click()
  await expect(page.locator('[data-sonner-toast]').getByRole('button', { name: '關閉' })).toHaveCount(1)
})

test('R12 — three open toasts stay inside the viewport', async ({ page }) => {
  await page.goto('/stress')
  await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
  await page.getByTestId('toast-different').click()
  await expect(page.locator('[data-sonner-toast][data-visible=true]')).toHaveCount(3)
  await settle(page)
  expect(await overflowing(page)).toEqual([])
})
