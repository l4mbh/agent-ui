import { expect, test, type Locator, type Page } from '@playwright/test'
import { clippedWithoutTitle, widths } from '../../registry/testing/rules'

// Page coordinates, as in button.spec.ts: hovering may scroll the page under the sticky header.
const box = async (l: Locator) => {
  const b = await l.boundingBox()
  if (!b) throw new Error('switch not visible')
  const scrollY = await l.page().evaluate(() => window.scrollY)
  return { x: Math.round(b.x * 2) / 2, y: Math.round((b.y + scrollY) * 2) / 2, w: Math.round(b.width * 2) / 2, h: Math.round(b.height * 2) / 2 }
}
const ready = async (page: Page, url: string) => {
  await page.goto(url)
  await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
}
const isDark = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('dark'))
const words = { en: { dark: 'Dark mode', language: 'Language' }, 'zh-TW': { dark: '深色模式', language: '語言' } } as const

for (const locale of ['en', 'zh-TW'] as const) {
  test(`R7 — the switch's box is identical in every state (${locale})`, async ({ page }) => {
    await ready(page, `/stress?locale=${locale}`)
    const sw = page.getByTestId('r7-switch')
    const row = sw.locator('xpath=..') // switch + visible label
    const rest = { sw: await box(sw), row: await box(row) }
    const same = async (state: string) => {
      expect(await box(sw), `${state} switch`).toEqual(rest.sw)
      expect(await box(row), `${state} label row`).toEqual(rest.row)
    }
    await sw.hover()
    await same('hover')
    await sw.focus()
    await same('focus')
    await page.mouse.down()
    await same('pressed')
    await page.mouse.up()
    await expect(sw).toHaveAttribute('aria-checked', 'true') // the press above toggled it on
    await same('checked')
    await page.keyboard.press('Space')
    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await same('unchecked by keyboard')
    await page.getByTestId('r7-switch-disabled').check()
    await expect(sw).toBeDisabled()
    await same('disabled')
  })

  test(`R7 — the header theme switch keeps its box in light and dark (${locale})`, async ({ page }) => {
    await ready(page, `/stress?locale=${locale}`)
    const sw = page.getByRole('banner').getByRole('switch', { name: words[locale].dark })
    const rest = await box(sw)
    await sw.click()
    expect(await box(sw)).toEqual(rest)
    await sw.click()
    expect(await box(sw)).toEqual(rest)
  })

  test(`R4 R14 — a long switch label is cut with a title; a hidden label is the name and the tooltip (${locale})`, async ({ page }) => {
    await ready(page, `/stress?locale=${locale}`)
    const long = page.getByTestId('r4-switch-long')
    const text = long.locator('xpath=..').locator('label span')
    expect(await text.evaluate((e) => e.scrollWidth > e.clientWidth + 1)).toBe(true)
    await expect(text).toHaveAttribute('title', /.{40,}/)
    await expect(long).toHaveAccessibleName(/.{40,}/) // the visible label names it
    expect(await clippedWithoutTitle(page, '[data-testid=section-switches]')).toEqual([])
    const hidden = page.getByTestId('r14-switch-hidden')
    await expect(hidden).toHaveAccessibleName(locale === 'en' ? 'Email me when someone replies' : '有人回覆時寄信通知我')
    await hidden.hover()
    await expect(page.getByRole('tooltip')).toBeVisible()
  })
}

test('theme switch flips html.dark, works by keyboard, and the pick survives a reload', async ({ page }) => {
  await ready(page, '/stress')
  const start = await isDark(page) // the project's colorScheme
  const sw = page.getByRole('banner').getByRole('switch', { name: 'Dark mode' })
  await expect(sw).toHaveAttribute('aria-checked', String(start))
  await sw.click()
  expect(await isDark(page)).toBe(!start)
  await expect(sw).toHaveAttribute('aria-checked', String(!start))
  await page.reload()
  await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
  expect(await isDark(page)).toBe(!start)
  await expect(sw).toHaveAttribute('aria-checked', String(!start))
  await sw.focus()
  await page.keyboard.press('Space')
  expect(await isDark(page)).toBe(start)
})

test('the page still renders and switches theme when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const blocked = () => { throw new DOMException('blocked', 'SecurityError') }
    Object.defineProperty(window, 'localStorage', { get: blocked })
  })
  await ready(page, '/stress')
  const start = await isDark(page)
  await page.getByRole('banner').getByRole('switch', { name: 'Dark mode' }).click()
  expect(await isDark(page)).toBe(!start)
})

test('an open toast follows a theme switch', async ({ page }) => {
  await ready(page, '/stress')
  await page.getByTestId('toast-error').click()
  const toaster = page.locator('[data-sonner-toaster]')
  const theme = async () => toaster.getAttribute('data-sonner-theme')
  const start = (await isDark(page)) ? 'dark' : 'light'
  await expect(toaster).toHaveAttribute('data-sonner-theme', start)
  await page.getByRole('banner').getByRole('switch', { name: 'Dark mode' }).click()
  await expect(toaster).toHaveAttribute('data-sonner-theme', start === 'dark' ? 'light' : 'dark')
  await expect(page.locator('[data-sonner-toast]')).toBeVisible()
  expect(await theme()).not.toBe(start)
})

for (const locale of ['en', 'zh-TW'] as const) {
  test(`locale switch — labelled, keyboard-operable, names each language in itself (${locale})`, async ({ page }) => {
    await ready(page, `/stress?locale=${locale}`)
    const other = locale === 'en' ? 'zh-TW' : 'en'
    const trigger = page.getByRole('banner').getByRole('button', { name: words[locale].language })
    await expect(trigger).toHaveCount(1)
    await trigger.focus()
    await page.keyboard.press('Enter')
    const items = page.getByRole('menuitemradio')
    await expect(items).toHaveText(['English', '繁體中文'])
    await expect(page.getByRole('menuitemradio', { checked: true })).toHaveAttribute('lang', locale)
    expect(new Set(await widths(items)).size).toBe(1) // R2
    // Esc closes and focus returns to the trigger (R15); then pick the other language by keyboard only.
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(items.first()).toBeFocused() // Radix focuses the first item when a menu opens by keyboard
    if (other === 'zh-TW') await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('menuitemradio', { name: other === 'en' ? 'English' : '繁體中文' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('lang', other)
    await expect(page.getByRole('banner').getByRole('button', { name: words[other].language })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('switch', { name: words[other].dark })).toBeVisible()
  })
}
