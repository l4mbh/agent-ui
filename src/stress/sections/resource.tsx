import { useResource } from '@/registry/hooks/use-resource'
import { useT } from '@/registry/i18n/i18n'
import { AppError } from '@/registry/lib/api'
import { Stack } from '@/registry/patterns/layout'
import { EmptyState, Resource } from '@/registry/patterns/states'
import { Text } from '@/registry/patterns/text'
import { Skeleton } from '@/registry/ui/skeleton'

// ?delay=ms, ?fail=CODE and ?empty=1 drive the fake load, so Playwright can see every state.
const params = new URLSearchParams(location.search)
const delay = Number(params.get('delay') ?? 0)
const fail = params.get('fail')
const empty = params.get('empty') === '1'

const fakeLoad = (signal: AbortSignal) => new Promise<string[]>((resolve, reject) => {
  const id = setTimeout(() => (fail ? reject(new AppError(fail, 500)) : resolve(empty ? [] : ['10/19 15:00–15:30', '10/23 14:00–14:30', '10/26 10:00–10:30'])), delay)
  signal.addEventListener('abort', () => clearTimeout(id))
})

export function ResourceSection() {
  const t = useT()
  const slots = useResource(fakeLoad, [])
  return (
    <div data-testid="resource">
      <Resource value={slots}
        skeleton={<Stack gap={2}><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></Stack>}
        empty={<EmptyState title={t('stress.resource.emptyTitle')} description={t('stress.resource.emptyNext')} />}>
        {(rows) => <Stack gap={2}>{rows.map((r) => <Text key={r} overflow="truncate" className="flex h-10 items-center rounded-md border px-3 text-sm tabular-nums">{r}</Text>)}</Stack>}
      </Resource>
      {/* Something below the data area, so a layout shift in it has something to move. */}
      <Text as="p" overflow="wrap" className="mt-3 text-sm text-muted-foreground" data-testid="resource-after">{t('stress.resource.after')}</Text>
    </div>
  )
}
