import { Fragment, useState, type ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { cn } from '@/registry/lib/utils'
import { useListSizeCheck, SearchBox, ShowMore, useShowMore } from '@/registry/patterns/list'
import { Text } from '@/registry/patterns/text'

export type Column<T> = { id: string; header: string; cell: (row: T) => ReactNode; primary?: boolean; numeric?: boolean; width?: string }

// R11: a real table from 640 px; below that each row becomes a card led by the primary column.
export function DataTable<T>({ columns, rows, getKey, empty, caption, pageSize = 10, search }: {
  columns: Column<T>[]
  rows: T[]
  getKey: (row: T) => string
  empty: ReactNode
  caption: string
  pageSize?: number
  search?: { label: string; getText: (row: T) => string }
}) {
  const t = useT()
  const [q, setQ] = useState('')
  useListSizeCheck(rows.length, false, Boolean(search))
  const filtered = search && q ? rows.filter((r) => search.getText(r).toLowerCase().includes(q.toLowerCase())) : rows
  const paging = useShowMore(filtered.length, pageSize)
  if (rows.length === 0) return <>{empty}</>

  const visible = filtered.slice(0, paging.shown)
  const primary = columns.find((c) => c.primary) ?? columns[0]
  const others = columns.filter((c) => c !== primary)

  return (
    <div className="grid gap-2">
      {search && <SearchBox label={search.label} value={q} onChange={(v) => { setQ(v); paging.reset() }} />}
      {filtered.length === 0 ? (
        <Text as="p" overflow="wrap" className="py-6 text-center text-sm text-muted-foreground">{t('agentui.noResults')}</Text>
      ) : (
        <>
          <table className="w-full table-fixed border-collapse text-sm max-sm:hidden">
            <caption className="sr-only">{caption}</caption>
            <colgroup>{columns.map((c) => <col key={c.id} style={c.width ? { width: c.width } : undefined} />)}</colgroup>
            <thead>
              <tr className="border-b">
                {columns.map((c) => (
                  <th key={c.id} scope="col" className={cn('h-9 px-3 text-left font-medium text-muted-foreground', c.numeric && 'text-right')}>
                    <Text overflow="truncate">{c.header}</Text>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={getKey(r)} className="border-b last:border-0">
                  {columns.map((c) => <td key={c.id} className={cn('h-11 px-3 align-middle', c.numeric && 'text-right tabular-nums')}>{c.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="grid gap-2 sm:hidden">
            {visible.map((r) => (
              <li key={getKey(r)} className="min-w-0 rounded-lg border p-3">
                <div className="min-w-0 font-medium">{primary.cell(r)}</div>
                <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                  {others.map((c) => (
                    <Fragment key={c.id}>
                      <dt className="text-muted-foreground">{c.header}</dt>
                      <dd className={cn('min-w-0', c.numeric && 'tabular-nums')}>{c.cell(r)}</dd>
                    </Fragment>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
      <ShowMore shown={paging.shown} total={filtered.length} pageSize={pageSize} more={paging.more} less={paging.less} />
    </div>
  )
}
