import { Languages } from 'lucide-react'
import { LOCALES, useT, type Locale } from '@/registry/i18n/i18n'
import { IconButton } from '@/registry/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/registry/ui/dropdown-menu'

/** Language menu for the AppShell header. Controlled: the app owns the locale and saves it. Each language is named in itself. */
export function LocaleSwitch({ value, onChange }: { value: Locale; onChange: (locale: Locale) => void }) {
  const t = useT()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton label={t('agentui.locale.label')} variant="ghost"><Languages /></IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Picking the current language again is not a change (an app may save on change). */}
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => { if (v !== value) onChange(v as Locale) }}>
          {LOCALES.map((l) => <DropdownMenuRadioItem key={l} value={l} lang={l}>{t(`agentui.locale.${l}`)}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
