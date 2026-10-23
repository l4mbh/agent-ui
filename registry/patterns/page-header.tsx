import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { cn } from '@/registry/lib/utils'
import { Text } from '@/registry/patterns/text'

/** R14: `description` is required — one sentence saying what this page is for or what it is waiting on. */
export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Text as="h1" overflow={{ clamp: 2 }} className="text-xl font-semibold tracking-tight">{title}</Text>
        <Text as="p" overflow="wrap" className="mt-1 text-sm text-muted-foreground">{description}</Text>
      </div>
      {/* Fixed half-width column, not content-sized: ActionBar folds by its own width, so a shrink-to-fit parent would fold short (CJK) labels needlessly. */}
      {actions && <div className="min-w-0 sm:w-1/2 sm:shrink-0">{actions}</div>}
    </header>
  )
}

export type Step = { label: string; detail?: string; state: 'done' | 'current' | 'todo' }

/** R14: where a multi-step flow is — done, now, next. */
export function Steps({ steps }: { steps: Step[] }) {
  const t = useT()
  return (
    <ol className="grid gap-2">
      {steps.map((s, i) => (
        <li key={i} aria-current={s.state === 'current' ? 'step' : undefined} className="flex items-start gap-2 text-sm">
          <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums',
            s.state === 'done' && 'bg-success text-white dark:text-background', s.state === 'current' && 'bg-primary text-primary-foreground', s.state === 'todo' && 'bg-muted text-muted-foreground')}>
            {s.state === 'done' ? <Check className="size-3" aria-hidden /> : i + 1}
          </span>
          <div className="min-w-0">
            <span className="sr-only">{t(`agentui.step.${s.state}`)}</span>
            <Text overflow="wrap" className={cn('block font-medium', s.state === 'todo' && 'text-muted-foreground')}>{s.label}</Text>
            {s.detail && <Text overflow="wrap" className="block text-muted-foreground">{s.detail}</Text>}
          </div>
        </li>
      ))}
    </ol>
  )
}
