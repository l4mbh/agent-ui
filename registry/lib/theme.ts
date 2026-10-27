import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'agent-ui.theme'
// Set once the user picks (or a saved pick is found): from then on the OS preference no longer moves the theme,
// also when storage is blocked and the pick cannot be saved.
let picked: Theme | null = null
let watching = false

// Storage throws in some private modes and with blocked site data; the theme then lasts for this page only.
function load(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function save(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // See load().
  }
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Call before the first render: the saved choice, else the OS preference, which it follows until the user picks. */
export function initTheme(): Theme {
  // No matchMedia (jsdom, non-browser render): start light rather than throw.
  const os = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  // A second call (HMR, an app calling it twice) keeps an unsaved pick when storage is blocked.
  picked = load() ?? picked
  apply(picked ?? (os?.matches ? 'dark' : 'light'))
  if (os && !watching) {
    watching = true
    os.addEventListener('change', (e) => { if (!picked) apply(e.matches ? 'dark' : 'light') })
  }
  return getTheme()
}

/** The user's pick: applied at once and saved for the next visit. */
export function setTheme(theme: Theme) {
  picked = theme
  save(theme)
  apply(theme)
}

// The `dark` class on <html> is the one source of truth, so an app that toggles it itself is followed too.
export function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/** The current theme; re-renders when it changes. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme)
}
