import { AppShell } from '@/registry/blocks/app-shell'
import { useT } from '@/registry/i18n/i18n'
import { PageHeader } from '@/registry/patterns/page-header'
import { Stress } from '@/stress/Stress'

const items = ['base', 'utils', 'i18n', 'text', 'layout', 'tooltip', 'button', 'status-badge', 'dropdown-menu', 'select', 'popover', 'action-bar', 'page-header', 'dialog', 'api', 'use-resource', 'skeleton', 'states', 'list', 'data-table', 'toast', 'app-shell', 'eslint', 'testing-rules']

export function App() {
  const t = useT()
  const stress = location.pathname === '/stress'
  return (
    <AppShell brand="agent-ui" nav={[{ href: '/', label: t('stress.nav.index'), current: !stress }, { href: '/stress', label: t('stress.title'), current: stress }]}
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
