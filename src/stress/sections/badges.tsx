import { Columns } from '@/registry/patterns/layout'
import { StatusBadge, type StatusSet } from '@/registry/patterns/status-badge'
import { Text } from '@/registry/patterns/text'
import { useLocale } from '@/registry/i18n/i18n'
import { long } from '@/stress/strings'

type MeetingStatus = 'asking' | 'tentative' | 'confirmed' | 'cancelled'
const meeting: StatusSet<MeetingStatus> = {
  asking: { label: 'stress.status.asking', tone: 'info' },
  tentative: { label: 'stress.status.tentative', tone: 'warning' },
  confirmed: { label: 'stress.status.confirmed', tone: 'success' },
  cancelled: { label: 'stress.status.cancelled', tone: 'neutral' },
}

// One badge per tone, so axe checks every tone's contrast (the meeting set has no destructive).
type ToneName = 'neutral' | 'info' | 'warning' | 'success' | 'destructive'
const tones: StatusSet<ToneName> = {
  neutral: { label: 'stress.status.cancelled', tone: 'neutral' },
  info: { label: 'stress.status.asking', tone: 'info' },
  warning: { label: 'stress.status.tentative', tone: 'warning' },
  success: { label: 'stress.status.confirmed', tone: 'success' },
  destructive: { label: 'stress.status.cancelled', tone: 'destructive' },
}

export function BadgesSection() {
  const s = long[useLocale()]
  return (
    <>
    <ul data-testid="badge-set-meeting" className="divide-y rounded-lg border">
      {(Object.keys(meeting) as MeetingStatus[]).map((status) => (
        <li key={status} className="px-3 py-2">
          <Columns template="minmax(0,1fr) auto" gap={3} collapseBelowSm={false}>
            <Text overflow="truncate" className="text-sm">{s.title}</Text>
            <StatusBadge status={status} states={meeting} />
          </Columns>
        </li>
      ))}
    </ul>
    <div data-testid="badge-set-tones" className="mt-3 flex flex-wrap gap-2">
      {(Object.keys(tones) as ToneName[]).map((k) => <StatusBadge key={k} status={k} states={tones} />)}
    </div>
    </>
  )
}
