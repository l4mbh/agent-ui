import { AppShell } from '@/registry/blocks/app-shell'
import { ThemeSwitch } from '@/registry/blocks/theme-switch'
import { useLocale, useT, type Locale } from '@/registry/i18n/i18n'
import { LocaleSwitch } from '@/registry/patterns/locale-switch'
import { PageHeader } from '@/registry/patterns/page-header'
import { Stress } from '@/stress/Stress'

const items = ['base', 'utils', 'i18n', 'text', 'layout', 'tooltip', 'button', 'status-badge', 'dropdown-menu', 'select', 'popover', 'action-bar', 'page-header', 'dialog', 'api', 'use-resource', 'skeleton', 'states', 'list', 'data-table', 'toast', 'switch', 'theme', 'theme-switch', 'locale-switch', 'app-shell', 'eslint', 'testing-rules']

const docs = 'https://github.com/l4mbh/agent-ui/blob/main/docs'

export function App({ onLocaleChange }: { onLocaleChange: (locale: Locale) => void }) {
  const t = useT()
  const locale = useLocale()
  const stress = location.pathname === '/stress'
  return (
    // Four tabs, a count, both switches and a long user name: the header's worst case (R1, R5).
    <AppShell brand="agent-ui" nav={[{ href: '/', label: t('stress.nav.index'), current: !stress }, { href: '/stress', label: t('stress.title'), current: stress },
      { href: `${docs}/RULES.md`, label: t('stress.nav.rules'), count: 15 }, { href: `${docs}/DECISIONS.md`, label: t('stress.nav.decisions') }]}
      actions={<><ThemeSwitch /><LocaleSwitch value={locale} onChange={onLocaleChange} /></>}
      user={{ name: 'someone.with.a.very.long.alias@example.com', menu: [{ id: 'out', label: t('stress.nav.signOut'), onSelect: () => {} }] }}>
      {stress ? <Stress /> : (
        <>
          <PageHeader title="agent-ui" description={t('stress.nav.indexDescription')} />
          <ul className="grid gap-1 text-sm">{items.map((i) => <li key={i} className="font-mono">npx shadcn add @agent-ui/{i}</li>)}</ul>
        </>
      )}
    </AppShell>
  )
}
