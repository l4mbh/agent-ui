import { afterEach, expect, it, vi } from 'vitest'
import { apiFetch, toAppError } from '@/registry/lib/api'

afterEach(() => vi.restoreAllMocks())

it('returns the JSON body', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
  expect(await apiFetch('/api/x')).toEqual({ ok: true })
})

it('uses the server error code', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":{"code":"NO_SLOT"}}', { status: 409 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'NO_SLOT', status: 409 })
})

it('hides an unexpected body behind BAD_RESPONSE and logs it', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>Traceback…</html>', { status: 500 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' })
  expect(console.error).toHaveBeenCalled()
})

it('reports a network failure as NETWORK', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'NETWORK' })
})

const brokenBody = () => { const r = new Response('{}', { status: 200 }); vi.spyOn(r, 'json').mockRejectedValue(new DOMException('aborted', 'AbortError')); return r }

it('rethrows the caller abort that happens while reading the body', async () => {
  const ac = new AbortController()
  const r = brokenBody()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { ac.abort(); return r })
  await expect(apiFetch('/api/x', { signal: ac.signal })).rejects.toMatchObject({ name: 'AbortError' })
})

it('reports a timeout while reading the body as TIMEOUT', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const r = brokenBody()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { await new Promise((ok) => setTimeout(ok, 20)); return r })
  await expect(apiFetch('/api/x', { timeoutMs: 5 })).rejects.toMatchObject({ code: 'TIMEOUT' })
})

it('returns undefined for 204 No Content', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
  expect(await apiFetch('/api/x', { method: 'DELETE' })).toBeUndefined()
})

it('logs a server-coded error with its code', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":{"code":"NO_SLOT"}}', { status: 409 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'NO_SLOT' })
  expect(console.error).toHaveBeenCalledWith('agent-ui: request failed with code', 'NO_SLOT', '/api/x', 409)
})

it('logs every thrown code in the same greppable shape', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'NETWORK' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 3)).toEqual(['agent-ui: request failed with code', 'NETWORK', '/api/x'])

  vi.mocked(globalThis.fetch).mockImplementationOnce((_p, init) => new Promise((_ok, no) => init!.signal!.addEventListener('abort', () => no(init!.signal!.reason))))
  await expect(apiFetch('/api/x', { timeoutMs: 5 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 3)).toEqual(['agent-ui: request failed with code', 'TIMEOUT', '/api/x'])

  vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response('<html>Traceback</html>', { status: 500 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 3)).toEqual(['agent-ui: request failed with code', 'BAD_RESPONSE', '/api/x'])

  vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response('not json', { status: 200 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 3)).toEqual(['agent-ui: request failed with code', 'BAD_RESPONSE', '/api/x'])

  expect(toAppError(new Error('boom'))).toMatchObject({ code: 'UNKNOWN' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 2)).toEqual(['agent-ui: request failed with code', 'UNKNOWN'])
})

it('logs a timeout while reading the body with its code', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const r = brokenBody()
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { await new Promise((ok) => setTimeout(ok, 20)); return r })
  await expect(apiFetch('/api/x', { timeoutMs: 5 })).rejects.toMatchObject({ code: 'TIMEOUT' })
  expect(vi.mocked(console.error).mock.calls.at(-1)?.slice(0, 3)).toEqual(['agent-ui: request failed with code', 'TIMEOUT', '/api/x'])
})

it.each(['no_slot', 'errors.X', '<b>x</b>', 'A'.repeat(65), '', 'NO SLOT'])('turns the server code %j into BAD_RESPONSE and logs the raw value', async (raw) => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code: raw } }), { status: 409 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code: 'BAD_RESPONSE', status: 409 })
  expect(console.error).toHaveBeenCalledWith('agent-ui: request failed with code', 'BAD_RESPONSE', '/api/x', 409, { error: { code: raw } })
})

it('accepts a plain server code up to 64 characters', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const code = 'A' + 'B_9'.repeat(21)
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { code } }), { status: 409 }))
  await expect(apiFetch('/api/x')).rejects.toMatchObject({ code })
})

it.each([
  ['Headers', new Headers({ Authorization: 'Bearer t' })],
  ['array', [['Authorization', 'Bearer t']] as [string, string][]],
  ['object', { Authorization: 'Bearer t' }],
])('keeps %s request headers and adds Accept', async (_kind, headers) => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  await apiFetch('/api/x', { headers })
  const sent = new Headers(fetch.mock.calls[0][1]!.headers)
  expect(sent.get('Authorization')).toBe('Bearer t')
  expect(sent.get('Accept')).toBe('application/json')
})

it('keeps a caller Accept header', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
  await apiFetch('/api/x', { headers: { Accept: 'text/plain' } }).catch(() => {})
  expect(new Headers(fetch.mock.calls[0][1]!.headers).get('Accept')).toBe('text/plain')
})
