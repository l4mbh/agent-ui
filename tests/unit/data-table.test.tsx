import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { I18nProvider } from '@/registry/i18n/i18n'
import { DataTable } from '@/registry/patterns/data-table'

// jsdom has no ResizeObserver; Text needs it.
vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} unobserve() {} })
afterEach(cleanup)

it('a search with no match says so, like List', () => {
  render(
    <I18nProvider locale="en" messages={{ en: {}, 'zh-TW': {} }}>
      <DataTable caption="c" rows={[{ id: 'a', n: 'Alpha' }, { id: 'b', n: 'Beta' }]} getKey={(r) => r.id} empty={null}
        columns={[{ id: 'n', header: 'Name', cell: (r) => r.n }]} search={{ label: 'Search', getText: (r) => r.n }} />
    </I18nProvider>,
  )
  expect(screen.queryByText('No matches')).toBeNull()
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } })
  expect(screen.getByText('No matches')).toBeTruthy()
  expect(screen.queryByRole('table')).toBeNull()
})
