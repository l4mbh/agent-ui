import { expect, test, type Page } from '@playwright/test'

type Nav = { navigation: { currentEntry: { index: number } } }
const position = (page: Page) => page.evaluate(() => (window as unknown as Nav).navigation.currentEntry.index)

const open = async (page: Page) => {
  await page.getByTestId('dialog-trigger').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  // Radix ignores an outside click right after opening (R17).
  await page.waitForTimeout(150)
}

for (const locale of ['en', 'zh-TW'] as const) {
  const name = (en: string, zh: string) => (locale === 'en' ? en : zh)
  test.describe(locale, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/stress?locale=${locale}`)
      await page.getByTestId('stress-ready').waitFor({ state: 'attached' })
    })

    test('R15 — closes by ×, Esc, overlay and Back; focus returns to the trigger', async ({ page }, info) => {
      const trigger = page.getByTestId('dialog-trigger')
      // Position in the history, not its length: entries ahead of us stay after Back.
      const before = await position(page)
      // Below 640 px the dialog covers the whole screen: there is no overlay to click.
      const narrow = info.project.name.startsWith('360')
      for (const how of ['x', 'esc', 'overlay', 'back'] as const) {
        if (how === 'overlay' && narrow) continue
        await open(page)
        if (how === 'x') await page.getByRole('dialog').getByRole('button', { name: name('Close', '關閉') }).click()
        if (how === 'esc') await page.keyboard.press('Escape')
        if (how === 'overlay') await page.mouse.click(2, 2)
        if (how === 'back') await page.goBack()
        await expect(page.getByRole('dialog'), how).toBeHidden()
        if (how !== 'overlay' && how !== 'back') await expect(trigger, how).toBeFocused()
        // No history entry is left behind by any way of closing.
        await expect.poll(() => position(page), how).toBe(before)
      }
      expect(new URL(page.url()).pathname).toBe('/stress')
    })

    test('R15 — unsaved text is never lost silently', async ({ page }) => {
      const start = await position(page)
      await open(page)
      const field = page.getByRole('dialog').getByRole('textbox').first()
      await field.fill('draft text')
      await page.keyboard.press('Escape')
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toBeVisible()
      await page.getByRole('button', { name: name('Keep editing', '繼續編輯') }).click()
      await expect(field).toHaveValue('draft text')
      await page.goBack()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toBeVisible()
      // A second Back is still guarded.
      await page.goBack()
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toBeVisible()
      await expect(field).toHaveValue('draft text')
      await page.getByRole('button', { name: name('Discard changes', '放棄修改') }).click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect.poll(() => position(page)).toBe(start)
    })

    test('R15 — a close from outside does not leave a stale discard bar', async ({ page }) => {
      await open(page)
      await page.getByRole('dialog').getByRole('textbox').first().fill('draft')
      await page.keyboard.press('Escape')
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toBeVisible()
      await page.getByTestId('dialog-force-close').click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await open(page)
      await expect(page.getByTestId('dialog-submit')).toBeVisible()
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toHaveCount(0)
    })

    test('R15 — close and navigate in one handler keeps the navigation', async ({ page }) => {
      const start = await position(page)
      await page.getByTestId('flow-trigger').click()
      await page.getByTestId('flow-nav').click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await page.waitForTimeout(300)
      expect(page.url()).toContain('step=2')
      // The dialog's own entry is left behind, the app's entry is kept: start + 2.
      expect(await position(page)).toBe(start + 2)
    })

    test('R15 — reopening right after a Back close keeps its history entry', async ({ page }) => {
      const start = await position(page)
      await page.getByTestId('reopen-trigger').click()
      await page.waitForTimeout(150)
      await page.goBack()
      await page.waitForTimeout(300)
      await expect(page.getByTestId('reopen-done')).toBeVisible()
      expect(await position(page)).toBe(start + 1)
      await page.goBack()
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect.poll(() => position(page)).toBe(start)
    })

    test('R15 — closing one dialog and opening the next keeps history consistent', async ({ page }) => {
      const start = await position(page)
      await page.getByTestId('flow-trigger').click()
      await page.waitForTimeout(150)
      await page.getByTestId('flow-next').click()
      await page.waitForTimeout(300)
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByTestId('flow-done')).toBeVisible()
      expect(await position(page)).toBe(start + 1)
      await page.getByTestId('flow-done').click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect.poll(() => position(page)).toBe(start)
    })

    test('R15 — keeps the router state of the entry under the dialog (React Router {key, idx})', async ({ page }) => {
      const state = () => page.evaluate(() => history.state)
      const tagged = { key: 'k', idx: 3, agentUiDialog: expect.any(String) }
      await page.evaluate(() => history.replaceState({ key: 'k', idx: 3 }, ''))
      await open(page)
      expect(await state()).toEqual(tagged)
      await page.getByRole('dialog').getByRole('button', { name: name('Close', '關閉') }).click()
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect.poll(state).toEqual({ key: 'k', idx: 3 })
      // A refused Back (dirty) puts the entry back with the same fields.
      await open(page)
      await page.getByRole('dialog').getByRole('textbox').first().fill('draft')
      await page.goBack()
      await expect(page.getByText(name('Discard unsaved changes?', '要放棄沒儲存的修改嗎？'))).toBeVisible()
      await expect.poll(state).toEqual(tagged)
      await page.getByRole('button', { name: name('Discard changes', '放棄修改') }).click()
      await expect.poll(state).toEqual({ key: 'k', idx: 3 })
      // The next dialog adopts the closing one's entry and keeps its fields.
      await page.getByTestId('flow-trigger').click()
      await page.waitForTimeout(150)
      await page.getByTestId('flow-next').click()
      await expect(page.getByTestId('flow-done')).toBeVisible()
      await page.waitForTimeout(300)
      expect(await state()).toEqual(tagged)
      await page.getByTestId('flow-done').click()
      await expect.poll(state).toEqual({ key: 'k', idx: 3 })
    })

    test('R15 — cannot close while submitting', async ({ page }, info) => {
      await open(page)
      await page.getByTestId('dialog-submit').click()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.goBack()
      await expect(page.getByRole('dialog')).toBeVisible()
      if (!info.project.name.startsWith('360')) {
        await page.mouse.click(2, 2)
        await expect(page.getByRole('dialog')).toBeVisible()
      }
    })

    test('R9 — footer button stays on screen with a long form; full screen when narrow', async ({ page }, info) => {
      await open(page)
      await expect(page.getByTestId('dialog-submit')).toBeInViewport()
      if (info.project.name.startsWith('360')) {
        const box = await page.getByRole('dialog').boundingBox()
        const vp = page.viewportSize()!
        expect(box?.x).toBeCloseTo(0, 0)
        expect(box?.y).toBeCloseTo(0, 0)
        expect(box?.width).toBeGreaterThanOrEqual(359)
        expect(box?.height).toBeCloseTo(vp.height, 0)
      }
    })
  })
}
