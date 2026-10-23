// Every API call goes through here: one timeout policy, one error shape. Users only ever see a code;
// the raw error goes to the console for whoever debugs it.
export class AppError extends Error {
  code: string
  status?: number
  constructor(code: string, status?: number) {
    super(code)
    this.code = code
    this.status = status
  }
}

// Every failure logs `request failed with code <CODE>` so the code a user quotes greps to its log line.
const fail = (code: string, ...detail: unknown[]) => console.error('agent-ui: request failed with code', code, ...detail)

// A server code becomes a message key (`errors.<CODE>`) and is shown to users: accept only plain codes.
const SERVER_CODE = /^[A-Z][A-Z0-9_]{0,63}$/

export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e
  fail('UNKNOWN', e)
  return new AppError('UNKNOWN')
}

export async function apiFetch<T>(path: string, { timeoutMs = 15_000, signal, headers, ...init }: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const timeout = AbortSignal.timeout(timeoutMs)
  let res: Response
  // new Headers() keeps Headers instances and [name, value][] inputs, which object spread would drop.
  const h = new Headers(headers)
  if (!h.has('Accept')) h.set('Accept', 'application/json')
  try {
    res = await fetch(path, { ...init, headers: h, signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
  } catch (e) {
    if (signal?.aborted) throw e
    const code = timeout.aborted ? 'TIMEOUT' : 'NETWORK'
    fail(code, path, e)
    throw new AppError(code)
  }
  const noContent = res.status === 204 || res.headers.get('content-length') === '0'
  let body: unknown
  try {
    body = noContent ? undefined : await res.json()
  } catch (e) {
    // An abort or timeout while reading the body is not a bad response.
    if (signal?.aborted) throw e
    if (timeout.aborted) {
      fail('TIMEOUT', path, 'while reading the body')
      throw new AppError('TIMEOUT')
    }
  }
  if (!res.ok) {
    const code = (body as { error?: { code?: unknown } } | undefined)?.error?.code
    if (typeof code === 'string' && SERVER_CODE.test(code)) {
      fail(code, path, res.status)
      throw new AppError(code, res.status)
    }
    fail('BAD_RESPONSE', path, res.status, body)
    throw new AppError('BAD_RESPONSE', res.status)
  }
  if (noContent) return undefined as T
  if (body === undefined) {
    fail('BAD_RESPONSE', path, res.status, 'response is not JSON')
    throw new AppError('BAD_RESPONSE', res.status)
  }
  return body as T
}
