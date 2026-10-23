import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Text } from '@/registry/patterns/text'
import { Button } from '@/registry/ui/button'

// R13 thresholds: beyond these a flat list stops being scannable.
export const GROUP_OR_SEARCH_OVER = 20
export const SEARCH_OVER = 50

// Warn in DEV only, and once per instance, so the console is not flooded on every render.
export function useListSizeCheck(count: number, grouped: boolean, searchable: boolean) {
  const warned = useRef(false)
  useEffect(() => {
    if (!import.meta.env.DEV || warned.current) return
    if (count > SEARCH_OVER && !searchable) console.error(`agent-ui R13: a list of ${count} items needs search`)
    else if (count > GROUP_OR_SEARCH_OVER && !grouped && !searchable) console.error(`agent-ui R13: a list of ${count} items needs groupBy or search`)
    else return
    warned.current = true
  }, [count, grouped, searchable])
}

export function useShowMore(total: number, pageSize: number) {
  const [shown, setShown] = useState(pageSize)
  return { shown: Math.min(shown, total), more: () => setShown((s) => s + pageSize), less: () => setShown(pageSize), reset: () => setShown(pageSize) }
}

export function ShowMore({ shown, total, pageSize, more, less }: { shown: number; total: number; pageSize: number; more: () => void; less: () => void }) {
  const t = useT()
  if (shown < total) return <Button variant="ghost" onClick={more}>{t('agentui.showMore', { count: Math.min(pageSize, total - shown), total })}</Button>
  if (total > pageSize) return <Button variant="ghost" onClick={less}>{t('agentui.showLess')}</Button>
  return null
}

export function SearchBox({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const t = useT()
  return <input type="search" aria-label={label} placeholder={t('agentui.search')} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm" />
}

export function List<T>({ items, getKey, renderItem, empty, pageSize = 8, groupBy, groupLabel = (g) => g, search }: {
  items: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  empty: ReactNode
  pageSize?: number
  groupBy?: (item: T) => string
  groupLabel?: (group: string) => string
  search?: { label: string; getText: (item: T) => string }
}) {
  const t = useT()
  const [q, setQ] = useState('')
  useListSizeCheck(items.length, Boolean(groupBy), Boolean(search))
  const filtered = search && q ? items.filter((i) => search.getText(i).toLowerCase().includes(q.toLowerCase())) : items
  const paging = useShowMore(filtered.length, pageSize)
  if (items.length === 0) return <>{empty}</>

  const visible = filtered.slice(0, paging.shown)
  const counts = new Map<string, number>()
  if (groupBy) for (const i of filtered) counts.set(groupBy(i), (counts.get(groupBy(i)) ?? 0) + 1)
  const groups: [string | null, T[]][] = []
  for (const i of visible) {
    const g = groupBy ? groupBy(i) : null
    const last = groups[groups.length - 1]
    if (last && last[0] === g) last[1].push(i)
    else groups.push([g, [i]])
  }

  return (
    <div className="grid gap-2">
      {search && <SearchBox label={search.label} value={q} onChange={(v) => { setQ(v); paging.reset() }} />}
      {filtered.length === 0 ? (
        <Text as="p" overflow="wrap" className="py-6 text-center text-sm text-muted-foreground">{t('agentui.noResults')}</Text>
      ) : (
        // Each group is its own <ul> under its heading: axe (list) rejects <li role="presentation"> inside a <ul>.
        <div className="divide-y rounded-lg border">
          {groups.map(([g, rows], gi) => (
            <Fragment key={`${g ?? ''}-${gi}`}>
              {g !== null && (
                <div className="flex items-center justify-between gap-3 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <Text overflow="truncate">{groupLabel(g)}</Text>
                  <span className="shrink-0 tabular-nums">{counts.get(g)}</span>
                </div>
              )}
              <ul className="divide-y">
                {rows.map((i) => <li key={getKey(i)} data-row className="min-w-0 px-3 py-2">{renderItem(i)}</li>)}
              </ul>
            </Fragment>
          ))}
        </div>
      )}
      <ShowMore shown={paging.shown} total={filtered.length} pageSize={pageSize} more={paging.more} less={paging.less} />
    </div>
  )
}
