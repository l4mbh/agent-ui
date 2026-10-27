import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { dsMessages } from '@/registry/i18n/messages'

export const LOCALES = ['en', 'zh-TW'] as const
export type Locale = (typeof LOCALES)[number]
export type Catalog = Record<string, string>
export type Catalogs = Record<Locale, Catalog>
export type Values = Record<string, string | number>

type Ctx = { locale: Locale; catalogs: Catalogs }
const I18nContext = createContext<Ctx | null>(null)

/** Plural forms are keys with a CLDR suffix (`.one`, `.other`), chosen by `values.count`. */
export function format(catalog: Catalog, locale: Locale, key: string, values?: Values): string {
  let template = catalog[key]
  if (values && typeof values.count === 'number') {
    const rule = new Intl.PluralRules(locale).select(values.count)
    template = catalog[`${key}.${rule}`] ?? catalog[`${key}.other`] ?? template
  }
  if (template === undefined) {
    console.error(`agent-ui: missing message "${key}" for ${locale}`)
    return key
  }
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (values && name in values ? String(values[name]) : whole))
}

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: Catalogs; children: ReactNode }) {
  const value = useMemo<Ctx>(
    () => ({
      locale,
      catalogs: {
        en: { ...dsMessages.en, ...messages.en },
        'zh-TW': { ...dsMessages['zh-TW'], ...messages['zh-TW'] },
      },
    }),
    [locale, messages],
  )
  // Screen readers pick their voice from <html lang> (WCAG 3.1.1), so it follows every locale change.
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useCtx(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('agent-ui: wrap the app in <I18nProvider>')
  return ctx
}

export function useT() {
  const { locale, catalogs } = useCtx()
  return (key: string, values?: Values) => format(catalogs[locale], locale, key, values)
}

/** The same message in every locale — StatusBadge sizes itself to the longest one (R3). */
export function useTAll() {
  const { catalogs } = useCtx()
  return (key: string, values?: Values) => LOCALES.map((l) => format(catalogs[l], l, key, values))
}

export function useHasMessage() {
  const { locale, catalogs } = useCtx()
  // hasOwn, not `in`: inherited names such as `constructor` are not messages.
  return (key: string) => Object.hasOwn(catalogs[locale], key)
}

export function useLocale(): Locale {
  return useCtx().locale
}
