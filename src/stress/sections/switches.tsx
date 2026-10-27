import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Stack } from '@/registry/patterns/layout'
import { Switch } from '@/registry/ui/switch'

export function SwitchesSection() {
  const t = useT()
  const [disabled, setDisabled] = useState(false)
  return (
    <Stack gap={3}>
      <Stack direction="row" gap={3} align="center" wrap>
        <Switch data-testid="r7-switch" label={t('stress.switch.notify')} disabled={disabled} />
        <label className="text-xs"><input type="checkbox" data-testid="r7-switch-disabled" onChange={(e) => setDisabled(e.target.checked)} /> disabled</label>
      </Stack>
      <div className="w-64"><Switch data-testid="r4-switch-long" label={t('stress.button.longLabel')} defaultChecked /></div>
      <Switch data-testid="r14-switch-hidden" label={t('stress.switch.notify')} hideLabel icon={<Bell aria-hidden />} />
    </Stack>
  )
}
