import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Tones and every token pair must pass WCAG AA contrast in light and dark (projects set colorScheme).
test('stress page passes axe WCAG 2 A/AA', async ({ page }, info) => {
  test.skip(!info.project.name.startsWith('1280'))
  for (const locale of ['en', 'zh-TW']) {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
  }
})
