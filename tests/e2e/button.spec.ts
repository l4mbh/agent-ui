import { expect, test, type Locator } from '@playwright/test'

// Page coordinates: hovering may scroll the page (the sticky AppShell header shifts the buttons down),
// which moves the viewport-relative box without the button itself changing.
const box = async (l: Locator) => {
  const b = await l.boundingBox()
  if (!b) throw new Error('button not visible')
  const scrollY = await l.page().evaluate(() => window.scrollY)
  return { x: Math.round(b.x * 2) / 2, y: Math.round((b.y + scrollY) * 2) / 2, w: Math.round(b.width * 2) / 2, h: Math.round(b.height * 2) / 2 }
}

for (const locale of ['en', 'zh-TW'] as const) {
  test(`R7 — the button's box is identical in five states (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    const label = locale === 'en' ? 'Ask everyone first' : '先問大家'
    for (const variant of ['primary', 'secondary', 'outline', 'destructive']) {
      const btn = page.getByTestId(`r7-${variant}`)
      const rest = await box(btn)
      await btn.hover()
      expect(await box(btn), `${variant} hover`).toEqual(rest)
      await btn.focus()
      expect(await box(btn), `${variant} focus`).toEqual(rest)
      await page.mouse.down()
      expect(await box(btn), `${variant} pressed`).toEqual(rest)
      await page.mouse.up()
      await page.getByTestId(`r7-${variant}-loading`).check()
      expect(await box(btn), `${variant} loading`).toEqual(rest)
      await expect(btn).toHaveAttribute('aria-busy', 'true')
      await expect(btn).toHaveAttribute('aria-disabled', 'true')
      await expect(btn).toHaveAccessibleName(label)
      await page.getByTestId(`r7-${variant}-loading`).uncheck()
      await page.getByTestId(`r7-${variant}-disabled`).check()
      expect(await box(btn), `${variant} disabled`).toEqual(rest)
      await page.getByTestId(`r7-${variant}-disabled`).uncheck()
    }
  })

  test(`R7 — a loading button ignores clicks (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('r7-primary-loading').check()
    await page.getByTestId('r7-primary').click({ force: true })
    await expect(page.getByTestId('r7-clicks')).toHaveText('0')
  })

  test(`R14 — icon buttons have an accessible name and a tooltip (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    const icon = page.getByTestId('r14-icon')
    await expect(icon).toHaveAttribute('aria-label', /.+/)
    await icon.hover()
    await expect(page.getByRole('tooltip')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toBeHidden()
  })

  test(`R14 — a disabled icon button still shows its tooltip (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('r14-disabled').hover({ force: true })
    await expect(page.getByRole('tooltip').first()).toBeVisible()
  })

  test(`R14 — a very long tooltip wraps and stays on screen (${locale})`, async ({ page }) => {
    await page.goto(`/stress?locale=${locale}`)
    await page.getByTestId('r14-long').hover()
    const tip = page.locator('[data-radix-popper-content-wrapper] > [data-state]').first()
    await expect(tip).toBeVisible()
    const b = (await tip.boundingBox())!
    const vw = page.viewportSize()!.width
    expect(b.width).toBeLessThanOrEqual(288)
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.x + b.width).toBeLessThanOrEqual(vw)
  })
}
