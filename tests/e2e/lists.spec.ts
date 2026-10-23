import { expect, test } from '@playwright/test'
import { horizontalScroll } from '../../registry/testing/rules'

for (const locale of ['en', 'zh-TW'] as const) {
  test.describe(locale, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/stress?locale=${locale}`)
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    })

    test('R13 — 100 items: grouped, counted, at most 2 screens tall, show more / less', async ({ page }) => {
      const list = page.getByTestId('list-100')
      const { height } = (await list.boundingBox())!
      expect(height).toBeLessThanOrEqual(2 * page.viewportSize()!.height)
      const more = list.getByRole('button', { name: locale === 'en' ? /Show \d+ more \(of 100\)/ : /再顯示 \d+ 個（共 100 個）/ })
      await more.click()
      await expect(list.getByRole('button', { name: locale === 'en' ? 'Show less' : '收起' })).toHaveCount(0)
      await expect(list.locator('li[data-row]')).toHaveCount(16)
    })

    test('R13 — search narrows the list', async ({ page }) => {
      const list = page.getByTestId('list-100')
      await list.getByRole('searchbox').fill('#042')
      await expect(list.locator('li[data-row]')).toHaveCount(1)
      // one result ≤ pageSize: no show more / less button
      await expect(list.getByRole('button')).toHaveCount(0)
    })

    test('R11 — table on wide screens, cards on narrow, no sideways page scroll', async ({ page }, info) => {
      const narrow = info.project.name.startsWith('360')
      await expect(page.getByTestId('table').locator('table')).toBeVisible({ visible: !narrow })
      await expect(page.getByTestId('table').locator('ul')).toBeVisible({ visible: narrow })
      expect(await horizontalScroll(page)).toBe(false)
    })

    test('no design-system errors at load', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (m) => { if (m.type() === 'error' && m.text().includes('agent-ui')) errors.push(m.text()) })
      await page.reload()
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
      expect(errors).toEqual([])
    })
  })
}
