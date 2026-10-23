import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/registry/i18n/i18n'
import { List } from '@/registry/patterns/list'

// jsdom has no ResizeObserver; Text (group headings) needs it.
vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

const items = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), g: i < n / 2 ? 'a' : 'b' }))
const ui = (n: number, extra: object = {}) => (
  <I18nProvider locale="en" messages={{ en: {}, 'zh-TW': {} }}>
    <List items={items(n)} getKey={(i) => i.id} renderItem={(i) => i.id} empty={null} {...extra} />
  </I18nProvider>
)

it('R13: 25 ungrouped items without search log once, not on every render', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  const { rerender } = render(ui(25))
  rerender(ui(25))
  const calls = error.mock.calls.filter((c) => String(c[0]).includes('agent-ui R13'))
  expect(calls).toEqual([['agent-ui R13: a list of 25 items needs groupBy or search']])
})

it('R13: over 50 items asks for search even when grouped', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(ui(60, { groupBy: (i: { g: string }) => i.g }))
  expect(error).toHaveBeenCalledWith('agent-ui R13: a list of 60 items needs search')
})

it('R13: 25 grouped items are quiet', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<StrictMode>{ui(25, { groupBy: (i: { g: string }) => i.g })}</StrictMode>)
  expect(error).not.toHaveBeenCalled()
})

it('show more then show less returns to pageSize; search hides the toggle when results fit', () => {
  render(ui(20, { search: { label: 'find', getText: (i: { id: string }) => i.id } }))
  expect(document.querySelectorAll('li[data-row]')).toHaveLength(8)
  fireEvent.click(screen.getByRole('button', { name: /Show 8 more \(of 20\)/ }))
  fireEvent.click(screen.getByRole('button', { name: /Show 4 more \(of 20\)/ }))
  expect(document.querySelectorAll('li[data-row]')).toHaveLength(20)
  fireEvent.click(screen.getByRole('button', { name: 'Show less' }))
  expect(document.querySelectorAll('li[data-row]')).toHaveLength(8)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '19' } })
  expect(document.querySelectorAll('li[data-row]')).toHaveLength(1)
  expect(screen.queryByRole('button')).toBeNull()
})
