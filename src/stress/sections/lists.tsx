import { useLocale, useT } from '@/registry/i18n/i18n'
import { DataTable } from '@/registry/patterns/data-table'
import { List } from '@/registry/patterns/list'
import { EmptyState } from '@/registry/patterns/states'
import { StatusBadge } from '@/registry/patterns/status-badge'
import { Nums, Text } from '@/registry/patterns/text'
import { long } from '@/stress/strings'

type Row = { id: string; day: string; time: string; note: string; replies: number }
const days = ['10/19', '10/20', '10/21', '10/22', '10/23']
const rows = (note: string): Row[] => Array.from({ length: 100 }, (_, i) => ({
  id: `#${String(i).padStart(3, '0')}`, day: days[i % days.length], time: `${9 + (i % 8)}:00–${9 + (i % 8)}:30`, note, replies: i % 12,
}))

export function ListsSection() {
  const t = useT()
  const s = long[useLocale()]
  const data = rows(s.sentence)
  const empty = <EmptyState title={t('stress.resource.emptyTitle')} description={t('stress.resource.emptyNext')} />
  return (
    <div className="grid gap-6">
      <div data-testid="list-100">
        <List items={data} getKey={(r) => r.id} empty={empty} groupBy={(r) => r.day}
          search={{ label: t('agentui.search'), getText: (r) => `${r.id} ${r.note}` }}
          renderItem={(r) => (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 text-sm">
              <Nums>{r.id} · {r.time}</Nums>
              <Text overflow="truncate">{r.note}</Text>
            </div>
          )} />
      </div>
      <div data-testid="table">
        <DataTable caption={t('stress.table.caption')} rows={data.slice(0, 12)} getKey={(r) => r.id} empty={empty}
          columns={[
            { id: 'note', header: t('stress.table.meeting'), primary: true, cell: (r) => <Text overflow="truncate">{r.note}</Text> },
            { id: 'time', header: t('stress.table.time'), width: '9rem', cell: (r) => <Nums>{r.day} {r.time}</Nums> },
            { id: 'status', header: t('stress.table.status'), width: '8rem', cell: () => <StatusBadge status="asking" states={{ asking: { label: 'stress.status.asking', tone: 'info' } }} /> },
            { id: 'replies', header: t('stress.table.replies'), width: '6rem', numeric: true, cell: (r) => r.replies },
          ]} />
      </div>
    </div>
  )
}
