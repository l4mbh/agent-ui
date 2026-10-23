import { Ellipsis, LoaderCircle } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Text } from '@/registry/patterns/text'
import { Button, IconButton } from '@/registry/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/registry/ui/dropdown-menu'

export type Action = { id: string; label: string; onSelect: () => void; loading?: boolean; disabled?: boolean; destructive?: boolean; testId?: string }

// R5: wraps instead of overflowing; the one primary action stays first; on narrow screens the secondary
// actions fold into "More actions" so the primary never ends up on its own line far below.
export function ActionBar({ primary, secondary = [], foldBelow = 480 }: { primary?: Action; secondary?: Action[]; foldBelow?: number }) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < foldBelow))
    ro.observe(el)
    return () => ro.disconnect()
  }, [foldBelow])

  const fold = narrow && secondary.length > 1
  return (
    <div ref={ref} className="flex w-full min-w-0 flex-wrap items-center gap-2">
      {primary && (
        <Button data-testid={primary.testId} variant="primary" loading={primary.loading} disabled={primary.disabled} onClick={primary.onSelect}>{primary.label}</Button>
      )}
      {!fold && secondary.map((a) => (
        <Button key={a.id} data-testid={a.testId} variant="outline" className={a.destructive ? 'text-destructive' : undefined} loading={a.loading} disabled={a.disabled} onClick={a.onSelect}>{a.label}</Button>
      ))}
      {fold && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><IconButton label={t('agentui.moreActions')} variant="outline"><Ellipsis /></IconButton></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondary.map((a) => (
              <DropdownMenuItem key={a.id} data-testid={a.testId} disabled={a.disabled || a.loading} destructive={a.destructive} onSelect={a.onSelect}>
                {/* Busy cue + disabled: a folded action in flight must not be selectable again (double submit). */}
                {a.loading && <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden />}
                <Text overflow="truncate">{a.label}</Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
