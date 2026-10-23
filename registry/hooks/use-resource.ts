import { useEffect, useState } from 'react'
import { type AppError, toAppError } from '@/registry/lib/api'

export type ResourceState<T> =
  | { status: 'pending'; showLoading: boolean }
  | { status: 'error'; error: AppError }
  | { status: 'empty' }
  | { status: 'data'; data: T }

// R8: no flash for fast answers (nothing shown under 200 ms); no flicker for slow ones (shown at least 400 ms).
const SHOW_AFTER_MS = 200
const KEEP_AT_LEAST_MS = 400

const emptyByDefault = (d: unknown) => Array.isArray(d) && d.length === 0

// The state remembers which request (deps + reload counter) it belongs to; state from another request is never shown.
type Keyed<T> = { deps: unknown[]; nonce: number; value: ResourceState<T> }
const sameDeps = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]))

export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[], { isEmpty = emptyByDefault }: { isEmpty?: (data: T) => boolean } = {}) {
  const [nonce, setNonce] = useState(0)
  const [keyed, setKeyed] = useState<Keyed<T>>({ deps, nonce: 0, value: { status: 'pending', showLoading: false } })

  useEffect(() => {
    const ac = new AbortController()
    let shownAt: number | null = null
    const put = (value: ResourceState<T>) => setKeyed({ deps, nonce, value })
    const show = setTimeout(() => { shownAt = Date.now(); put({ status: 'pending', showLoading: true }) }, SHOW_AFTER_MS)
    const settle = (next: ResourceState<T>) => {
      clearTimeout(show)
      const wait = shownAt === null ? 0 : Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - shownAt))
      setTimeout(() => { if (!ac.signal.aborted) put(next) }, wait)
    }
    load(ac.signal).then(
      (data) => settle(isEmpty(data) ? { status: 'empty' } : { status: 'data', data }),
      (e: unknown) => { if (!ac.signal.aborted) settle({ status: 'error', error: toAppError(e) }) },
    )
    return () => { ac.abort(); clearTimeout(show) }
    // `deps` is the caller's dependency list, like useEffect's.
  }, [...deps, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = keyed.nonce === nonce && sameDeps(keyed.deps, deps)
  const state: ResourceState<T> = current ? keyed.value : { status: 'pending', showLoading: false }
  return { ...state, reload: () => setNonce((n) => n + 1) }
}
