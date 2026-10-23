import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { format, I18nProvider, LOCALES, useTAll } from '@/registry/i18n/i18n'
import { dsMessages } from '@/registry/i18n/messages'
import { stressMessages } from '@/stress/messages'

const base = (k: string) => k.replace(/\.(zero|one|two|few|many|other)$/, '')

describe('format', () => {
  it('fills values', () => {
    expect(format({ hi: 'Hi {name}' }, 'en', 'hi', { name: 'Mei' })).toBe('Hi Mei')
  })
  it('picks the plural form from count', () => {
    const c = { 'more.one': 'Show 1 more', 'more.other': 'Show {count} more' }
    expect(format(c, 'en', 'more', { count: 1 })).toBe('Show 1 more')
    expect(format(c, 'en', 'more', { count: 5 })).toBe('Show 5 more')
  })
  it('falls back to .other in a language without .one', () => {
    expect(format({ 'more.other': '再顯示 {count} 個' }, 'zh-TW', 'more', { count: 1 })).toBe('再顯示 1 個')
  })
  it('returns the key when the message is missing, so the gap is visible', () => {
    expect(format({}, 'en', 'nope')).toBe('nope')
  })
})

describe('catalogs', () => {
  for (const [name, catalogs] of [['design system', dsMessages], ['stress page', stressMessages]] as const) {
    it(`${name}: every key exists in every locale`, () => {
      const keys = LOCALES.map((l) => new Set(Object.keys(catalogs[l]).map(base)))
      expect([...keys[0]].sort()).toEqual([...keys[1]].sort())
    })
    it(`${name}: every plural key has .other in every locale`, () => {
      for (const l of LOCALES) {
        const plurals = Object.keys(catalogs[l]).filter((k) => k !== base(k)).map(base)
        for (const p of plurals) expect(catalogs[l][`${p}.other`], `${l} ${p}.other`).toBeDefined()
      }
    })
  }
})

it('useTAll returns the message in every locale', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider locale="en" messages={{ en: {}, 'zh-TW': {} }}>{children}</I18nProvider>
  const { result } = renderHook(() => useTAll(), { wrapper })
  expect(result.current('agentui.close')).toEqual(['Close', '關閉'])
})
