import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppError } from '@/registry/lib/api'
import { useResource } from '@/registry/hooks/use-resource'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const deferred = <T,>() => { let resolve!: (v: T) => void; let reject!: (e: unknown) => void; const promise = new Promise<T>((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }

it('shows no loading for a fast answer', async () => {
  const d = deferred<string[]>()
  const { result } = renderHook(() => useResource(() => d.promise, []))
  expect(result.current).toMatchObject({ status: 'pending', showLoading: false })
  await act(async () => { d.resolve(['a']); await vi.advanceTimersByTimeAsync(0) })
  expect(result.current).toMatchObject({ status: 'data', data: ['a'] })
})

it('shows loading after 200 ms and keeps it at least 400 ms', async () => {
  const d = deferred<string[]>()
  const { result } = renderHook(() => useResource(() => d.promise, []))
  await act(() => vi.advanceTimersByTimeAsync(200))
  expect(result.current).toMatchObject({ status: 'pending', showLoading: true })
  await act(async () => { d.resolve(['a']); await vi.advanceTimersByTimeAsync(100) })
  expect(result.current.status).toBe('pending')
  await act(() => vi.advanceTimersByTimeAsync(300))
  expect(result.current.status).toBe('data')
})

it('reports empty lists as empty', async () => {
  const { result } = renderHook(() => useResource(async () => [], []))
  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(result.current.status).toBe('empty')
})

it('turns failures into an AppError with a code', async () => {
  const { result } = renderHook(() => useResource(async () => { throw new AppError('SLOTS_FAILED', 500) }, []))
  await act(() => vi.advanceTimersByTimeAsync(0))
  expect(result.current).toMatchObject({ status: 'error', error: { code: 'SLOTS_FAILED' } })
})

it('never renders the previous data under new deps', async () => {
  const a = deferred<string[]>(); const b = deferred<string[]>()
  // Every render is recorded: the stale render happens before any effect cleanup, so reading result.current afterwards would miss it.
  const renders: { id: string; status: string; data?: string[] }[] = []
  const { rerender } = renderHook(({ id }) => {
    const r = useResource(() => (id === 'A' ? a.promise : b.promise), [id])
    renders.push({ id, status: r.status, data: 'data' in r ? r.data : undefined })
    return r
  }, { initialProps: { id: 'A' } })
  await act(async () => { a.resolve(['A']); await vi.advanceTimersByTimeAsync(0) })
  rerender({ id: 'B' })
  await act(async () => { b.resolve(['B']); await vi.advanceTimersByTimeAsync(0) })
  expect(renders.some((r) => r.id === 'A' && r.data?.[0] === 'A')).toBe(true)
  expect(renders.filter((r) => r.id === 'B' && r.data?.[0] === 'A')).toEqual([])
  expect(renders.at(-1)).toMatchObject({ id: 'B', status: 'data', data: ['B'] })
})
