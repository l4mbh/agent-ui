import { ChevronDown } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { cn } from '@/registry/lib/utils'
import { Text } from '@/registry/patterns/text'
import { PrimaryScope } from '@/registry/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/registry/ui/dropdown-menu'
import { ToastRegion } from '@/registry/ui/toast'

export type NavItem = { href: string; label: string; count?: number; current?: boolean }

export function AppShell({ brand, nav, user, actions, onNavigate, children }: {
  brand: ReactNode
  nav: NavItem[]
  user?: { name: string; menu: { id: string; label: string; onSelect: () => void }[] }
  /** Header controls before the user menu (e.g. ThemeSwitch, LocaleSwitch). Below 640 px the tabs then move to a
   *  second row, so the controls never squeeze the tabs to nothing. */
  actions?: ReactNode
  onNavigate?: (href: string) => void
  children: ReactNode
}) {
  const t = useT()
  const go = (href: string) => (e: MouseEvent) => {
    if (!onNavigate || e.metaKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    onNavigate(href)
  }
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        {/* Without `actions` the header renders exactly as in v0.1.0; the max-sm: classes apply only with them. */}
        <div className={cn('mx-auto flex h-14 max-w-6xl items-center gap-4 px-4', actions && 'max-sm:h-auto max-sm:flex-wrap max-sm:gap-x-2 max-sm:gap-y-0')}>
          <div className="flex shrink-0 items-center gap-2 font-semibold">{brand}</div>
          {/* The tab row scrolls inside itself on narrow screens; the page never scrolls sideways (R11).
              Only this subtree is exempt from overflow checks: brand and user menu stay measured. */}
          <nav aria-label={t('agentui.nav.main')} className={cn('min-w-0 flex-1 overflow-x-auto', actions && 'max-sm:order-last max-sm:basis-full max-sm:pb-2')} data-allow-overflow>
            <ul className="flex w-max gap-1">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} onClick={go(n.href)} aria-current={n.current ? 'page' : undefined}
                    className={cn('inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground', n.current && 'bg-accent text-foreground')}>
                    {n.label}
                    {n.count ? <span className="rounded-full bg-primary px-1.5 text-xs tabular-nums text-primary-foreground">{n.count}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {actions && <div className="flex h-14 shrink-0 items-center gap-1 max-sm:ml-auto">{actions}</div>}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger className={cn('inline-flex h-9 min-w-0 max-w-40 shrink-0 items-center gap-1 rounded-md px-2 text-sm hover:bg-accent', actions && 'max-sm:shrink')}>
                <Text overflow="truncate">{user.name}</Text><ChevronDown className="size-4 shrink-0" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user.menu.map((m) => <DropdownMenuItem key={m.id} onSelect={m.onSelect}>{m.label}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6"><PrimaryScope>{children}</PrimaryScope></main>
      <ToastRegion />
    </div>
  )
}
