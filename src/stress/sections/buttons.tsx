import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Stack } from '@/registry/patterns/layout'
import { Button, IconButton, PrimaryScope } from '@/registry/ui/button'

const variants = ['primary', 'secondary', 'outline', 'destructive'] as const

export function ButtonsSection() {
  const t = useT()
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [disabled, setDisabled] = useState<Record<string, boolean>>({})
  const [clicks, setClicks] = useState(0)
  return (
    <PrimaryScope>
      <Stack gap={3}>
        {variants.map((v) => (
          <Stack key={v} direction="row" gap={3} align="center" wrap>
            <Button data-testid={`r7-${v}`} variant={v} loading={loading[v]} disabled={disabled[v]} onClick={() => setClicks((c) => c + 1)}>
              {t('stress.button.ask')}
            </Button>
            <label className="text-xs"><input type="checkbox" data-testid={`r7-${v}-loading`} onChange={(e) => setLoading((s) => ({ ...s, [v]: e.target.checked }))} /> loading</label>
            <label className="text-xs"><input type="checkbox" data-testid={`r7-${v}-disabled`} onChange={(e) => setDisabled((s) => ({ ...s, [v]: e.target.checked }))} /> disabled</label>
          </Stack>
        ))}
        <span data-testid="r7-clicks" className="text-xs tabular-nums">{clicks}</span>
        <IconButton data-testid="r14-disabled" disabled label={t('stress.button.remind')} variant="ghost"><Bell /></IconButton>
        <IconButton data-testid="r14-long" label={t('stress.button.longLabel')} variant="ghost"><Bell /></IconButton>
        <IconButton data-testid="r14-icon" label={t('stress.button.remind')} variant="ghost"><Bell /></IconButton>
      </Stack>
    </PrimaryScope>
  )
}
