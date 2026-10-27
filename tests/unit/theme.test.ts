import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

// A fake OS preference that can change while the page is open.
function fakeOs(dark: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = []
  const mq = { matches: dark, addEventListener: (_: string, l: (e: { matches: boolean }) => void) => listeners.push(l) }
  vi.stubGlobal('matchMedia', () => mq)
  return (next: boolean) => { mq.matches = next; listeners.forEach((l) => l({ matches: next })) }
}

// theme.ts keeps the user's pick in module state, so each test loads a fresh copy.
const load = async () => { vi.resetModules(); return import('@/registry/lib/theme') }
const isDark = () => document.documentElement.classList.contains('dark')

beforeEach(() => { localStorage.clear(); document.documentElement.className = '' })
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('starts from the OS preference when nothing is saved', async () => {
  fakeOs(true)
  const { initTheme } = await load()
  expect(initTheme()).toBe('dark')
  expect(isDark()).toBe(true)
})

it('a saved choice wins over the OS', async () => {
  fakeOs(true)
  localStorage.setItem('agent-ui.theme', 'light')
  const { initTheme } = await load()
  expect(initTheme()).toBe('light')
  expect(isDark()).toBe(false)
})

it('ignores a saved value that is not a theme', async () => {
  fakeOs(true)
  localStorage.setItem('agent-ui.theme', 'purple')
  const { initTheme } = await load()
  expect(initTheme()).toBe('dark')
})

it('follows OS changes until the user picks, then keeps the pick', async () => {
  const os = fakeOs(false)
  const { initTheme, setTheme } = await load()
  initTheme()
  os(true)
  expect(isDark()).toBe(true)
  setTheme('light')
  expect(localStorage.getItem('agent-ui.theme')).toBe('light')
  os(false)
  os(true)
  expect(isDark()).toBe(false)
})

it('never throws when storage is blocked, and still keeps the pick for this page', async () => {
  const os = fakeOs(true)
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('blocked', 'SecurityError') })
  const { initTheme, setTheme } = await load()
  expect(initTheme()).toBe('dark')
  expect(() => setTheme('light')).not.toThrow()
  expect(isDark()).toBe(false)
  os(true)
  expect(isDark()).toBe(false)
  initTheme() // a second call (HMR) must not forget the unsaved pick
  os(true)
  expect(isDark()).toBe(false)
})

it('starts light without matchMedia instead of throwing', async () => {
  vi.stubGlobal('matchMedia', undefined)
  const { initTheme } = await load()
  expect(initTheme()).toBe('light')
})

it('useTheme re-renders on setTheme and on a class toggled by the app itself', async () => {
  fakeOs(false)
  const { initTheme, setTheme, useTheme } = await load()
  initTheme()
  const { result } = renderHook(() => useTheme())
  expect(result.current).toBe('light')
  act(() => setTheme('dark'))
  await waitFor(() => expect(result.current).toBe('dark'))
  act(() => { document.documentElement.classList.remove('dark') })
  await waitFor(() => expect(result.current).toBe('light'))
})

it('adds one OS listener however often initTheme runs', async () => {
  const add = vi.fn()
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: add }))
  const { initTheme } = await load()
  initTheme()
  initTheme()
  expect(add).toHaveBeenCalledTimes(1)
})
