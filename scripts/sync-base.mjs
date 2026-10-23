// theme.css is the single source of the tokens; this copies them into the `base` item before `shadcn build`,
// so the JSON shipped to apps can never drift from the CSS the stress page is tested with.
import { readFileSync, writeFileSync } from 'node:fs'

const css = readFileSync('registry/base/theme.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`theme.css has no "${selector}" block`)
  return Object.fromEntries([...m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]))
}

const registry = JSON.parse(readFileSync('registry.json', 'utf8'))
const base = registry.items.find((i) => i.name === 'base')
if (!base) throw new Error('registry.json has no "base" item')
base.cssVars = { theme: block('@theme inline'), light: block(':root'), dark: block('.dark') }
writeFileSync('registry.json', `${JSON.stringify(registry, null, 2)}\n`)
console.log(`base: ${Object.keys(base.cssVars.light).length} light, ${Object.keys(base.cssVars.dark).length} dark, ${Object.keys(base.cssVars.theme).length} theme vars`)
