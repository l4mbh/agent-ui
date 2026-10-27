import { Moon, Sun } from 'lucide-react'
import { useT } from '@/registry/i18n/i18n'
import { setTheme, useTheme } from '@/registry/lib/theme'
import { Switch } from '@/registry/ui/switch'

/** Light/dark switch for the AppShell header; the pick is saved. Call initTheme() in main.tsx. */
export function ThemeSwitch() {
  const t = useT()
  const dark = useTheme() === 'dark'
  return (
    <Switch label={t('agentui.theme.dark')} hideLabel checked={dark} onCheckedChange={(on) => setTheme(on ? 'dark' : 'light')}
      icon={dark ? <Moon aria-hidden /> : <Sun aria-hidden />} />
  )
}
