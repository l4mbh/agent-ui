# Decisions

## Registry dependencies and imports (probe, 2026-10-22)
Measured with shadcn CLI 4.22.1, consumer made by `shadcn init -t vite -b radix` (default preset Nova),
registry served from `http://127.0.0.1:4174/r/{name}.json`.

- Same-registry dependency syntax: `@agent-ui/<name>` (e.g. `"registryDependencies": ["@agent-ui/utils"]`).
  Installed our `utils` (identical to `registry/lib/utils.ts`). Bare `utils` did NOT resolve to our item:
  it installed shadcn's own `utils`, whose content is `export { cn } from "cn"`, not ours.
  Note: `shadcn add` without `--overwrite` keeps an existing `src/lib/utils.ts` (init creates one);
  with `-y --overwrite` it replaced it with ours.
- Imports inside items: `@/registry/...` IS rewritten on install to the consumer's aliases;
  source `import { cn } from '@/registry/lib/utils'` was installed as `import { cn } from '@/lib/utils'`.
- Convention for every item: write imports as `@/registry/<lib|ui|hooks>/...` and declare same-registry
  dependencies as `@agent-ui/<name>`; never use bare names for our own items.

## Theme deviations from shadcn defaults
- Light `--muted-foreground` is `oklch(0.5 0 0)` instead of shadcn's `oklch(0.556 0 0)`: the default fails WCAG AA
  on `bg-muted` (neutral StatusBadge, 12px text). Axe: `#636363` on `#f5f5f5` = 5.51:1 after the change.
- StatusBadge `destructive` tone, light only: text is `color-mix(in oklch, var(--destructive), black 25%)` instead of
  `var(--destructive)` (shared token untouched, buttons keep it). Axe: 3.83:1 (`#e7000b` on `#fce0e2`) -> 6.93:1
  (`#9d0005`). Dark keeps `text-destructive`: 6.03:1 (`#ff6467` on `#271515`).
- Other tones passed unchanged (axe, light / dark): info 6.42 / 8.24, warning 4.96 / 8.63, success 5.83 / 8.66,
  neutral 5.51 / 5.85.

## shadcn build accepts `target` and `devDependencies` (Task 15)
`npx shadcn build` (4.22.1) accepts `"target"` on a `registry:file` entry and `devDependencies` on items; output JSON keeps both. The `eslint` and `testing-rules` items use them.

## Registry install proof (Task 16, local server; fix round 1)
Built `public/r` (24 items + `registry.json`; consecutive builds are byte-identical) and installed all 16 app-facing items into a fresh `shadcn@4.22.1 init -t vite -b radix -p nova` app from a local static server; `tsc -b`, `vite build` and a full `npx eslint .` pass.
- `shadcn init` needs `-p nova` (or another preset) in non-interactive runs.
- Consumer aliases (`components`, `ui`, `lib`, `utils`, `hooks`) all point under `@/components/agent-ui` so everything vendored lives in `src/components/agent-ui/`, the folder `agentUi()` ignores by default. The `eslint` item's `target` is `components/agent-ui/eslint/agent-ui.eslint.js` (targets resolve under `src/`). Init's own `src/components/ui/button.tsx` stays in the app and is the app's.
- Re-adding over existing files needs `--overwrite -y`.
- ESLint 10: `eslint-plugin-react@7.37.5` (latest) peers ESLint <= 9, so a fresh Vite app (ESLint 10) failed with ERESOLVE. Fixed at the source: `react/jsx-no-literals` was replaced by the in-house `agent-ui/no-literal-ui-text`; the `eslint` item has no devDependencies and `legacy-peer-deps` is not needed. Verified manually (not part of `npm test`): in a fresh consumer on ESLint 10, `eslint .` is clean on vendored files and reports both rules on a file with `<div className="flex">Hi</div>`; with `ignores: []` it reports 43 findings in the vendored files (positive control).
- `python3 -m http.server` resets connections (ECONNRESET) under shadcn's parallel fetches; use `npx http-server public -p 4174 -c-1` for the local check.
