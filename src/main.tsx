import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { I18nProvider, type Locale } from '@/registry/i18n/i18n'
import { initTheme } from '@/registry/lib/theme'
import { stressMessages } from '@/stress/messages'
import './index.css'

// The saved pick, else the OS (which is what Playwright's colorScheme sets). ?theme=dark|light wins for this view only (not saved).
initTheme()
const params = new URLSearchParams(location.search)
const forced = params.get('theme')
if (forced) document.documentElement.classList.toggle('dark', forced === 'dark')

function Root() {
  const [locale, setLocale] = useState<Locale>(params.get('locale') === 'zh-TW' ? 'zh-TW' : 'en')
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  return <I18nProvider locale={locale} messages={stressMessages}><App onLocaleChange={setLocale} /></I18nProvider>
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>)
