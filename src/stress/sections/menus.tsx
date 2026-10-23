import { useState } from 'react'
import { useLocale, useT } from '@/registry/i18n/i18n'
import { Stack } from '@/registry/patterns/layout'
import { Text } from '@/registry/patterns/text'
import { Button } from '@/registry/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/registry/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/ui/popover'
import { Select } from '@/registry/ui/select'
import { long } from '@/stress/strings'

export function MenusSection() {
  const t = useT()
  const s = long[useLocale()]
  const [deadline, setDeadline] = useState('24h')
  return (
    <Stack direction="row" gap={4} wrap align="start">
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button data-testid="menu-trigger">{t('stress.menu.wait')}</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>{t('stress.menu.wait2h')}</DropdownMenuItem>
          <DropdownMenuItem>{t('stress.menu.wait1d')}</DropdownMenuItem>
          <DropdownMenuItem>{t('stress.menu.custom')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>{s.title}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button data-testid="wide-menu-trigger" className="w-72">{t('stress.menu.wait')}</Button></DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>{t('stress.menu.wait2h')}</DropdownMenuItem>
          <DropdownMenuItem>{t('stress.menu.wait1d')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="w-56">
        <Select data-testid="select-trigger" label={t('stress.menu.deadline')} value={deadline} onValueChange={setDeadline}
          options={[{ value: '24h', label: t('stress.menu.24h') }, { value: 'eod', label: t('stress.menu.eod') }, { value: '2d', label: s.sentence }]} />
      </div>
      <div className="w-72">
        <Select data-testid="wide-select-trigger" label={t('stress.menu.deadline')} value={deadline} onValueChange={setDeadline}
          options={[{ value: '24h', label: t('stress.menu.24h') }, { value: 'eod', label: t('stress.menu.eod') }]} />
      </div>
      <Popover>
        <PopoverTrigger asChild><Button data-testid="popover-trigger">{t('stress.menu.where')}</Button></PopoverTrigger>
        <PopoverContent title={s.title}><Text as="p" overflow="wrap" className="text-sm">{s.sentence}</Text></PopoverContent>
      </Popover>
    </Stack>
  )
}
