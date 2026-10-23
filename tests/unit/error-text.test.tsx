import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it } from 'vitest'
import { I18nProvider, useHasMessage } from '@/registry/i18n/i18n'
import { AppError } from '@/registry/lib/api'
import { useErrorText } from '@/registry/patterns/states'

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider locale="en" messages={{ en: { 'errors.NO_SLOT': 'That time is taken.' }, 'zh-TW': {} }}>{children}</I18nProvider>
)
const errorText = (code: string) => renderHook(() => useErrorText(), { wrapper }).result.current(new AppError(code))

it('uses the app sentence for a known code', () => {
  expect(errorText('NO_SLOT')).toEqual({ sentence: 'That time is taken.', codeLine: 'Error code NO_SLOT' })
})

it('falls back to the generic sentence for an unknown code, never the raw key', () => {
  for (const code of ['NOPE', 'constructor', 'toString', 'X']) {
    const { sentence, codeLine } = errorText(code)
    expect(sentence).toBe('Something went wrong. Try again, or contact your administrator.')
    expect(sentence).not.toContain('errors.')
    expect(codeLine).toBe(`Error code ${code}`)
  }
})

it('useHasMessage ignores inherited object names', () => {
  const has = renderHook(() => useHasMessage(), { wrapper }).result.current
  expect([has('errors.NO_SLOT'), has('constructor'), has('toString'), has('errors.NOPE')]).toEqual([true, false, false, false])
})
