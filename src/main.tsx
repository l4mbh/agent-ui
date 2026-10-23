import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/App'
import { I18nProvider, type Locale } from '@/registry/i18n/i18n'
import { stressMessages } from '@/stress/messages'
import './index.css'

// ?theme=dark|light wins; otherwise follow the OS (which is what Playwright's colorScheme sets).
const params = new URLSearchParams(location.search)
const theme = params.get('theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.classList.toggle('dark', theme === 'dark')

const locale: Locale = params.get('locale') === 'zh-TW' ? 'zh-TW' : 'en'
document.documentElement.lang = locale

createRoot(document.getElementById('root')!).render(<StrictMode><I18nProvider locale={locale} messages={stressMessages}><App /></I18nProvider></StrictMode>)
