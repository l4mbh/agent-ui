import { expect, test } from '@playwright/test'
import { clippedWithoutTitle, overflowing, widths } from '../../registry/testing/rules'

for (const locale of ['en', 'zh-TW'] as const) {
  test.describe(locale, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/stress?locale=${locale}`)
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    })

    test('R2 — dropdown items share one width, at least the trigger width', async ({ page }) => {
      const trigger = page.getByTestId('menu-trigger')
      await trigger.click()
      const items = page.getByRole('menuitem')
      const w = await widths(items)
      expect(new Set(w).size).toBe(1)
      expect(w[0]).toBeGreaterThanOrEqual(((await trigger.boundingBox())?.width ?? 0) - 10)
    })

    test('R2 — select options share one width', async ({ page }) => {
      await page.getByTestId('select-trigger').click()
      expect(new Set(await widths(page.getByRole('option'))).size).toBe(1)
    })

    test('R2 — a menu is at least as wide as a wide trigger', async ({ page }) => {
      const trigger = page.getByTestId('wide-menu-trigger')
      await trigger.click()
      expect(new Set(await widths(page.getByRole('menuitem'))).size).toBe(1)
      // Items sit inside the menu's border and padding (10px), so the menu box itself carries the trigger width.
      expect((await page.getByRole('menu').boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(((await trigger.boundingBox())?.width ?? 0) - 1)
    })

    test('R2 — select options are at least as wide as the select trigger', async ({ page }) => {
      const trigger = page.getByTestId('wide-select-trigger')
      await trigger.click()
      const tw = (await trigger.boundingBox())?.width ?? 0
      expect((await page.getByRole('listbox').boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(tw - 1)
    })

    test('R4 — long menu item and select option are really clipped and carry a title', async ({ page }) => {
      await page.getByTestId('menu-trigger').click()
      const clipped = (l: import('@playwright/test').Locator) => l.evaluate((e) => [e, ...e.querySelectorAll('*')].some((n) => n.scrollWidth > n.clientWidth + 1))
      expect(await clipped(page.getByRole('menuitem').last())).toBe(true)
      expect(await clippedWithoutTitle(page)).toEqual([])
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toHaveCount(0) // the closing menu animates out; measure the select alone
      await page.getByTestId('select-trigger').click()
      expect(await clipped(page.getByRole('option').last())).toBe(true)
      expect(await clippedWithoutTitle(page)).toEqual([])
    })

    test('select check indicator sits inside its option row', async ({ page }) => {
      await page.getByTestId('select-trigger').click()
      const opt = page.getByRole('option', { selected: true })
      const o = await opt.boundingBox()
      const c = await opt.locator('svg').boundingBox()
      expect(c?.y ?? -1).toBeGreaterThanOrEqual((o?.y ?? 0) - 0.5)
      expect((c?.y ?? 0) + (c?.height ?? 0)).toBeLessThanOrEqual((o?.y ?? 0) + (o?.height ?? 0) + 0.5)
    })

    test('open menu and select stay inside the viewport', async ({ page }) => {
      const vw = page.viewportSize()?.width ?? 0
      for (const id of ['menu-trigger', 'select-trigger']) {
        await page.getByTestId(id).click()
        const box = await page.locator('[role=menu], [role=listbox]').boundingBox()
        expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(vw)
        expect(box?.x).toBeGreaterThanOrEqual(0)
        expect(await overflowing(page)).toEqual([])
        await page.keyboard.press('Escape')
        // A closed menu stays mounted (data-state=closed) while it animates out; wait it out so the next
        // locator does not match two popups.
        await expect(page.locator('[role=menu], [role=listbox]')).toHaveCount(0)
      }
    })

    test('R15 — a dropdown closes with Esc and with a click outside', async ({ page }) => {
      await page.getByTestId('menu-trigger').click()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('menu')).toBeHidden()
      await expect(page.getByTestId('menu-trigger')).toBeFocused()
      await page.getByTestId('menu-trigger').click()
      await page.waitForTimeout(150) // Radix arms its outside-click listener a moment after open; a human cannot click faster
      await page.mouse.click(5, 5)
      await expect(page.getByRole('menu')).toBeHidden()
    })

    test('R15 — a select closes with Esc (focus back on its trigger) and with a click outside', async ({ page }) => {
      const trigger = page.getByTestId('select-trigger')
      await trigger.click()
      await expect(page.getByRole('listbox')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('listbox')).toHaveCount(0)
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(page.getByRole('listbox')).toBeVisible()
      await page.waitForTimeout(150) // see dropdown test
      await page.mouse.click(5, 5)
      await expect(page.getByRole('listbox')).toHaveCount(0)
    })

    test('R15 — a popover closes with ×, Esc and a click outside, focus back on its trigger', async ({ page }) => {
      const trigger = page.getByTestId('popover-trigger')
      for (const close of ['x', 'esc', 'outside'] as const) {
        await trigger.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        if (close === 'x') await dialog.getByRole('button', { name: locale === 'en' ? 'Close' : '關閉' }).click()
        if (close === 'esc') await page.keyboard.press('Escape')
        if (close === 'outside') { await page.waitForTimeout(150); await page.mouse.click(5, 5) } // see dropdown test
        await expect(dialog, close).toBeHidden()
        if (close !== 'outside') await expect(trigger, close).toBeFocused()
      }
    })
  })
}
