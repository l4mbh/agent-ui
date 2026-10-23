import type { Locator, Page } from '@playwright/test'

// These run inside the page. Each returns a short description of every offending element, so a failing
// assertion prints what to fix rather than "expected [] to equal [...]" with no context.

// Known limits (NOT measured): absolutely positioned descendants clipped by a non-containing ancestor,
// ::before/::after text, overlap between lines of the same text node, opacity:0 layers, hard clipping
// without an ellipsis, shadow DOM and iframes. `primaries` counts per view: run it on one screen, not on a
// showcase page that stacks several views (each with its own primary).

type Win = Window & { __agentUiCls?: number }

/** Two frames after web fonts are ready: widths measured before the font swap are wrong. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  })
}

/** R1, R5, R6: content that spills out of a box that does not clip it. */
export async function overflowing(page: Page, scope = 'body'): Promise<string[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel)
    if (!root) return [`scope not found: ${sel}`]
    const out: string[] = []
    for (const el of [root as HTMLElement, ...root.querySelectorAll<HTMLElement>('*')]) {
      if (el.closest('[data-allow-overflow]')) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden') continue
      // Fixed/absolute boxes pushed past the viewport edge are unreachable by scrolling.
      if (cs.position === 'fixed' || cs.position === 'absolute') {
        const r = el.getBoundingClientRect()
        if (r.left < 0 || r.right > document.documentElement.clientWidth) {
          out.push(`<${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 40)}" is position:${cs.position} and extends beyond the viewport (${Math.round(r.left)}..${Math.round(r.right)})`)
        }
      }
      if (cs.display === 'inline' || cs.display === 'contents') continue
      // A collapsed flex item (width 0 but content inside) must still be measured.
      if ((el.clientWidth === 0 && el.scrollWidth === 0) || cs.overflowX !== 'visible') continue
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push(`<${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 40)}" spills ${el.scrollWidth - el.clientWidth}px`)
      }
    }
    return out
  }, scope)
}

/** R4: text cut by an ellipsis or a line clamp must carry its full text in `title`. */
export async function clippedWithoutTitle(page: Page, scope = 'body'): Promise<string[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel)
    if (!root) return [`scope not found: ${sel}`]
    const out: string[] = []
    for (const el of [root as HTMLElement, ...root.querySelectorAll<HTMLElement>('*')]) {
      if (el.closest('[data-allow-overflow]')) continue
      const cs = getComputedStyle(el)
      const clamp = cs.getPropertyValue('-webkit-line-clamp')
      const cuts = cs.textOverflow === 'ellipsis' || (clamp !== '' && clamp !== 'none')
      if (!cuts || cs.visibility === 'hidden') continue
      const clipped = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      if (clipped && !el.closest('[title]:not([title=""])')) out.push(`<${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 40)}" is cut without a title`)
    }
    return out
  }, scope)
}

/** R14 (ruling R28): one visible `[data-variant=primary]` outside dialogs, and at most one inside each `[role=dialog]`.
 *  Measure a whole view (a page, an open dialog), not a showcase page that stacks several views. */
export async function primaries(page: Page, scope = 'body'): Promise<string[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel)
    if (!root) return [`scope not found: ${sel}`]
    const groups = new Map<Element | null, string[]>()
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (!el.matches('[data-variant=primary]') || !el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue
      const dialog = el.closest('[role=dialog]')
      groups.set(dialog, [...(groups.get(dialog) ?? []), `"${(el.textContent ?? '').trim().slice(0, 40)}"`])
    }
    return [...groups].filter(([, names]) => names.length > 1).map(([dialog, names]) =>
      `${names.length} visible primary buttons ${dialog ? `in dialog "${(dialog.getAttribute('aria-label') ?? dialog.textContent ?? '').trim().slice(0, 40)}"` : 'outside dialogs'}: ${names.join(', ')}`)
  }, scope)
}

/** R1: visible glyph boxes of two different elements must not cross. */
export async function overlappingText(page: Page, scope = 'body'): Promise<string[]> {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel)
    if (!root) return [`scope not found: ${sel}`]
    // Cut a text rect to what its clipping ancestors (including its own element) actually show.
    const visible = (r: DOMRect, from: Element): DOMRect | null => {
      let { left, top, right, bottom } = r
      for (let a: Element | null = from; a; a = a.parentElement) {
        if (getComputedStyle(a).overflowX === 'visible' && getComputedStyle(a).overflowY === 'visible') continue
        const c = a.getBoundingClientRect()
        left = Math.max(left, c.left); top = Math.max(top, c.top); right = Math.min(right, c.right); bottom = Math.min(bottom, c.bottom)
      }
      return right - left > 1 && bottom - top > 1 ? new DOMRect(left, top, right - left, bottom - top) : null
    }
    const boxes: { r: DOMRect; el: Element; node: Node; text: string }[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement
      if (!el || !n.textContent?.trim() || el.closest('[data-allow-overflow]')) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      const range = document.createRange()
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) {
        const v = visible(r, el)
        if (v) boxes.push({ r: v, el, node: n, text: n.textContent.trim() })
      }
    }
    const out: string[] = []
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        if (a.node === b.node) continue
        const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
        const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
        // A quarter of the shorter box's height: line boxes of tight leading touch, real overlaps cross.
        if (w > 1 && h > Math.min(a.r.height, b.r.height) / 4) {
          out.push(`"${a.text.slice(0, 30)}" overlaps "${b.text.slice(0, 30)}"`)
        }
      }
    }
    return out
  }, scope)
}

/** R11: the page itself never scrolls sideways. */
export async function horizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => (document.scrollingElement?.scrollWidth ?? 0) > document.documentElement.clientWidth)
}

/** R2, R3: widths of every matched element, rounded to half a pixel. */
export async function widths(locator: Locator): Promise<number[]> {
  return locator.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width * 2) / 2))
}

/** R8: call before page.goto; sums layout shifts not caused by input. */
export async function trackLayoutShift(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as Win
    w.__agentUiCls = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) w.__agentUiCls = (w.__agentUiCls ?? 0) + e.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
}

export async function layoutShift(page: Page): Promise<number> {
  const v = await page.evaluate(() => (window as Win).__agentUiCls)
  if (v === undefined) throw new Error('trackLayoutShift(page) must run before page.goto')
  return v
}
