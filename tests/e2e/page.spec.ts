import { expect, test } from '@playwright/test'
import { overflowing } from '../../registry/testing/rules'

for (const locale of ['en', 'zh-TW'] as const) {
  test.describe(locale, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/stress?locale=${locale}`)
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    })

    test('R5 — the action bar never overflows and keeps the primary visible', async ({ page }) => {
      const bar = page.getByTestId('section-page')
      expect(await overflowing(page, '[data-testid=section-page]')).toEqual([])
      const primary = bar.locator('[data-variant=primary]')
      await primary.scrollIntoViewIfNeeded()
      await expect(primary).toBeInViewport()
    })

    test('R5 — below 480 px the secondary actions fold into one menu', async ({ page }, info) => {
      const section = page.getByTestId('section-page')
      const more = section.getByRole('button', { name: locale === 'en' ? 'More actions' : '更多動作' })
      // The bar sits in a half-width column on >=640 px, so 768 is legitimately narrower than 480: assert on the bar's real width.
      const barWidth = (await section.locator('[data-variant=primary]').locator('..').boundingBox())!.width
      if (info.project.name.startsWith('360')) expect(barWidth).toBeLessThan(480)
      if (barWidth < 480) await expect(more).toBeVisible()
      else await expect(more).toHaveCount(0)
    })

    test('R14 — the page has one primary action and no agent-ui console errors (missing messages)', async ({ page }) => {
      // PrimaryScope warns only in DEV; the preview build cannot see it, so the count below is the real R14 guard.
      const errors: string[] = []
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
      await page.reload()
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
      expect(errors.filter((e) => e.includes('agent-ui'))).toEqual([])
      await expect(page.getByTestId('section-page').locator('[data-variant=primary]')).toHaveCount(1)
    })

    test('R5 — a loading action folded into More actions is disabled and cannot fire', async ({ page }, info) => {
      test.skip(!info.project.name.startsWith('360'), 'only folded at narrow widths')
      const section = page.getByTestId('section-page')
      await section.getByRole('button', { name: locale === 'en' ? 'More actions' : '更多動作' }).click()
      const item = page.getByTestId('busy-action')
      await expect(item).toHaveAttribute('data-disabled', '')
      await item.click({ force: true })
      await expect(section.getByTestId('busy-fired')).toHaveText('0')
    })

    test('R14 — every step has a state word for screen readers', async ({ page }) => {
      const steps = page.getByTestId('section-page').locator('ol > li')
      await expect(steps.nth(0)).toContainText(locale === 'en' ? 'Done' : '已完成')
      await expect(steps.nth(1)).toContainText(locale === 'en' ? 'Current step' : '目前步驟')
      await expect(steps.nth(2)).toContainText(locale === 'en' ? 'Not started' : '尚未開始')
    })

    test('R14 — the current step is marked', async ({ page }) => {
      await expect(page.getByTestId('section-page').locator('[aria-current=step]')).toHaveCount(1)
    })
  })
}
