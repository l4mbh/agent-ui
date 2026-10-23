import { useT, useTAll } from '@/registry/i18n/i18n'
import { cn } from '@/registry/lib/utils'

export type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'destructive'
/** `label` is a message key. One set per kind of status (meeting status, reply, …). */
export type StatusSet<S extends string> = Record<S, { label: string; tone: Tone }>

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-info/12 text-info',
  warning: 'bg-warning/15 text-warning',
  success: 'bg-success/12 text-success',
  destructive: 'bg-destructive/12 text-[color-mix(in_oklch,var(--destructive),black_25%)] dark:text-destructive',
}

// R3: every label of the set, in every language, sits invisibly in the same grid cell, so the badge is always
// as wide as the longest one — no measuring in JS, no jump when the status or the language changes.
export function StatusBadge<S extends string>({ status, states }: { status: S; states: StatusSet<S> }) {
  const t = useT()
  const tAll = useTAll()
  const sizers = (Object.values(states) as { label: string }[]).flatMap((s) => tAll(s.label))
  return (
    <span data-slot="status-badge" className={cn('inline-grid shrink-0 place-items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[states[status].tone])}>
      {sizers.map((label, i) => (
        <span key={i} aria-hidden className="invisible [grid-area:1/1]">{label}</span>
      ))}
      <span className="[grid-area:1/1]">{t(states[status].label)}</span>
    </span>
  )
}
