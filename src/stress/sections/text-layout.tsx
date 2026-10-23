import { useLocale } from '@/registry/i18n/i18n'
import { Columns, Stack } from '@/registry/patterns/layout'
import { Nums, Text } from '@/registry/patterns/text'
import { long } from '@/stress/strings'

export function TextLayoutSection() {
  const s = long[useLocale()]
  return (
    <Stack gap={4}>
      <Columns template="minmax(0,1fr) minmax(0,1fr)" collapseBelowSm={false}>
        <Text overflow="truncate" className="rounded border p-2 text-sm">{s.title}</Text>
        <Text overflow="truncate" className="rounded border p-2 text-sm">{s.sentence}</Text>
      </Columns>
      <Columns template="minmax(0,1fr) auto">
        <Text overflow={{ clamp: 2 }} className="text-sm">{s.sentence}</Text>
        <Nums className="text-sm">10:00–11:30 · 14:15–15:45</Nums>
      </Columns>
      {/* Plain wrapper child in a "1fr" (= minmax(auto,1fr)) track: only Columns' `*:min-w-0` lets it shrink (R1). */}
      <Columns template="1fr auto" collapseBelowSm={false}>
        <div><Text overflow="truncate" className="text-sm">{s.sentence}</Text></div>
        <Nums className="text-sm">09:00</Nums>
      </Columns>
      <p className="w-64 text-sm">
        Next: <Text overflow="truncate" className="w-24">{s.title}</Text> then <Nums>09:00</Nums>.
      </p>
      <Stack direction="row" gap={2}>
        <Text overflow="wrap" className="w-40 rounded border p-2 text-sm">{s.email}</Text>
        <Text overflow="truncate" className="w-40 rounded border p-2 text-sm">{s.email}</Text>
      </Stack>
    </Stack>
  )
}
