# agent-ui

A personal base design system for any React app. shadcn/ui, Neutral theme, `en` + `zh-TW`.
Every component enforces the rules R1–R15 (see docs/RULES.md); `/stress` shows them under the worst text,
and `npm test` measures them at 360 / 768 / 1280 / 1920 px in light and dark.

## Use it in an app
1. New app: `npx shadcn@4.22.1 init -t vite -b radix -p nova --no-monorepo` (without `-p` it waits at the preset prompt).
2. `components.json`: add the registry and point every alias at one vendored folder, so the lint rules can skip it:
   ```json
   "aliases": { "components": "@/components/agent-ui", "ui": "@/components/agent-ui/ui", "lib": "@/components/agent-ui/lib", "utils": "@/components/agent-ui/lib/utils", "hooks": "@/components/agent-ui/hooks" },
   "registries": { "@agent-ui": "https://raw.githubusercontent.com/l4mbh/agent-ui/v0.2.0/public/r/{name}.json" }
   ```
   The repo is public, so no token is needed. Pin the tag in the URL; bump it to upgrade.
3. `npx shadcn add @agent-ui/base @agent-ui/app-shell … --overwrite -y`. `--overwrite` is needed when the app already has a file an item installs (init creates `src/lib/utils.ts`; with the aliases above ours goes to `src/components/agent-ui/lib/utils.ts`).
4. Do not edit the installed files; change them here and release a new tag.

### Wire it
```tsx
// Imports with the aliases above:
// '@/components/agent-ui/app-shell', '@/components/agent-ui/theme-switch', '@/components/agent-ui/locale-switch',
// '@/components/agent-ui/lib/i18n' (I18nProvider, useT, useLocale, Locale), '@/components/agent-ui/lib/theme' (initTheme)

// main.tsx: the theme before the first render (saved pick, else the OS, followed until the user picks).
// A fresh Vite template wraps <App> in its own ThemeProvider: remove it, initTheme() replaces it.
initTheme()
// AppShell, and every component that shows text, throws outside <I18nProvider>. The app owns the locale;
// I18nProvider keeps <html lang> on it.
function Root() {
  const [locale, setLocale] = useState<Locale>('en') // or the user's saved language
  return <I18nProvider locale={locale} messages={messages}><App onLocaleChange={setLocale} /></I18nProvider>
}
createRoot(document.getElementById('root')!).render(<Root />)

// App.tsx
export function App({ onLocaleChange }: { onLocaleChange: (l: Locale) => void }) {
  const t = useT()
  return (
    <AppShell brand="Acme" nav={[{ href: '/', label: t('nav.home'), current: true }]}
      actions={<><ThemeSwitch /><LocaleSwitch value={useLocale()} onChange={onLocaleChange} /></>}>
      <Home />
    </AppShell>
  )
}
```
- Theme (`@agent-ui/theme`): `initTheme()` once before rendering, `setTheme('dark' | 'light')` for a pick (saved in
  `localStorage['agent-ui.theme']`), `useTheme()` to read it. The `dark` class on `<html>` is the source of truth, so
  toasts follow any change live. Blocked storage never throws; the pick then lasts for the page only. The `base` item
  sets CSS `color-scheme` (`light` on `:root`, `dark` on `.dark`), so native scrollbars, date inputs and selects follow.
- Header `actions` (`ThemeSwitch`, `LocaleSwitch`, or your own controls) sit before the user menu. From 640 px the header
  is one row: brand, tabs (scroll inside themselves), actions, user menu. Below 640 px it becomes two rows: brand,
  actions and user menu on the first (the user name truncates first), the tabs alone on the second at full width.
  Without `actions` the header is exactly v0.1.0's. Keep the brand short: it and the actions never shrink.
- `LocaleSwitch` is controlled: `onChange` gets the new locale only when it differs; save it where your app keeps it.
- `messages` is `{ en: {...}, 'zh-TW': {...} }` with flat keys (`meetings.title`, plurals `x.one` / `x.other`) and one
  `errors.<CODE>` sentence per server code (`{error:{code}}`, `^[A-Z][A-Z0-9_]{0,63}$`, anything else becomes
  `BAD_RESPONSE`); a code without a sentence shows the generic one, always with the code.
- Toasts use the same map: `import { toAppError } from '@/components/agent-ui/lib/api'` (`lib` alias), then `const err = useErrorText(); notify.error(err(toAppError(e)).sentence, err(toAppError(e)).codeLine)`.
- A sticky bottom bar: set `--agent-ui-sticky-bottom` (its height) on `:root` so toasts sit above it (R12).
- `useResource(load, deps)`: deps must be primitives or stable references; an inline object re-fetches every ~200 ms.
- `DataTable` renders the table and the cards together (CSS picks one): no `data-testid`s or primary buttons inside cells.
- With the rules library, an element positioned off-screen on purpose needs `data-allow-overflow`.

### Lint rules (`@agent-ui/eslint`)
Lands in `src/components/agent-ui/eslint/agent-ui.eslint.js`. Wire it in `eslint.config.js`:
```js
import agentUi from './src/components/agent-ui/eslint/agent-ui.eslint.js'
export default defineConfig([globalIgnores(['dist']), ...agentUi(), /* your config */])
```
Rules: `agent-ui/no-raw-layout` (use `<Stack>`/`<Columns>`) and `agent-ui/no-literal-ui-text` (text via `useT()`, also in
`title`, `description`, `label`, `placeholder`, `aria-label`, `alt`, … — see `TEXT_PROPS`); the vendored `src/components/agent-ui/**` is ignored. No extra npm dependencies.

### Layout measurements (`@agent-ui/testing-rules`)
Lands in `src/components/agent-ui/lib/rules.ts` and adds `@playwright/test` as a devDependency.
```ts
import { test, expect } from '@playwright/test'
import { settle, overflowing, primaries } from '../src/components/agent-ui/lib/rules'

test('no overflow', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  expect(await overflowing(page)).toEqual([])
  expect(await primaries(page)).toEqual([]) // one primary per view (R14); not on a page that stacks several views
})
```
Checks: `overflowing`, `clippedWithoutTitle`, `overlappingText`, `primaries`, `horizontalScroll`, `widths`,
`trackLayoutShift` + `layoutShift`. Known limits are listed at the top of `rules.ts`.

## Release
`npm test` → `npm run registry:build` → commit `public/r` → tag `vX.Y.Z` → push the tag.
