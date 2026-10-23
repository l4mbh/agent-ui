import { expect, test } from '@playwright/test'
// Playwright does not read the Vite aliases, so e2e specs import the registry by relative path.
import { clippedWithoutTitle, horizontalScroll, layoutShift, overflowing, overlappingText, primaries, settle, trackLayoutShift, widths } from '../../registry/testing/rules'

// The checks only need to prove themselves once, not in every width/theme.
test.beforeEach(({}, info) => test.skip(info.project.name !== '1280-light'))

test('every check reports the bug planted in broken.html', async ({ page }) => {
  await page.goto('/test-fixtures/broken.html')
  await settle(page)
  const over = (await overflowing(page)).join('\n')
  expect(over).toContain('someone.with.a.very.long.alias')
  expect(over).toContain('Promo banner')
  const clipped = (await clippedWithoutTitle(page)).join('\n')
  expect(clipped).toContain('工單〈官網改版排程〉')
  expect(clipped).toContain('Clamped paragraph')
  const overlap = (await overlappingText(page)).join('\n')
  expect(overlap).toContain('客戶 A 報價討論')
  expect(overlap).toContain('Quarterly')
  expect(overlap).toContain('99+')
  expect(await horizontalScroll(page)).toBe(true)
  expect(new Set(await widths(page.locator('#menu li'))).size).toBeGreaterThan(1)
  expect(await primaries(page)).toEqual([
    '2 visible primary buttons outside dialogs: "Send invite", "Save draft"',
    '2 visible primary buttons in dialog "Edit meeting": "Save", "Save and close"',
  ])
})

test('no check reports anything on clean.html', async ({ page }) => {
  await page.goto('/test-fixtures/clean.html')
  await settle(page)
  expect(await overflowing(page)).toEqual([])
  expect(await clippedWithoutTitle(page)).toEqual([])
  expect(await overlappingText(page)).toEqual([])
  expect(await horizontalScroll(page)).toBe(false)
  expect(new Set(await widths(page.locator('#menu li'))).size).toBe(1)
  expect(await primaries(page)).toEqual([])
})

test('scoped root itself is measured', async ({ page }) => {
  await page.goto('/test-fixtures/broken.html')
  await settle(page)
  expect(await overflowing(page, '#mail')).not.toEqual([])
  expect(await clippedWithoutTitle(page, '#clip')).not.toEqual([])
  expect(await primaries(page, '[role=dialog]')).toEqual(['2 visible primary buttons in dialog "Edit meeting": "Save", "Save and close"'])
})

test('layoutShift sees a late insertion and refuses to run untracked', async ({ page }) => {
  await trackLayoutShift(page)
  await page.goto('/test-fixtures/shift.html')
  await expect.poll(() => layoutShift(page)).toBeGreaterThan(0.05)
  const fresh = await page.context().newPage()
  await fresh.goto('/test-fixtures/clean.html')
  await expect(layoutShift(fresh)).rejects.toThrow('trackLayoutShift(page) must run before page.goto')
})
