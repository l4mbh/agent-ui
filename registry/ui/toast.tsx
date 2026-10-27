import { toast, Toaster } from 'sonner'
import { useT } from '@/registry/i18n/i18n'
import { useTheme } from '@/registry/lib/theme'

const bottom = 'calc(var(--agent-ui-sticky-bottom, 0px) + 16px)'

/** R12: one region per app, at most three, above any sticky bottom bar (set --agent-ui-sticky-bottom on :root). */
export function ToastRegion() {
  const t = useT()
  const theme = useTheme()
  // mobileOffset is separate in sonner (<= 600px), so both get the lift. Sonner's mobile list is width:100% starting 16px in, which
  // pokes 16px past the right edge; the class narrows it and the toasts fill it (width:100%) so they stay inside the viewport.
  return <Toaster className="max-[600px]:w-[calc(100%-32px)]!" visibleToasts={3} closeButton position="bottom-right" offset={{ bottom }} mobileOffset={{ bottom }}
    theme={theme} toastOptions={{ style: { width: '100%' }, closeButtonAriaLabel: t('agentui.close') }} />
}

type Kind = 'info' | 'success' | 'error'
const repeats = new Map<string, number>()

// R12: the same message again updates the toast that is already there and counts it, instead of stacking.
function show(kind: Kind, message: string, detail?: string) {
  const id = `${kind}|${message}|${detail ?? ''}`
  const n = (repeats.get(id) ?? 0) + 1
  repeats.set(id, n)
  // Closing by ×, swipe or timeout ends the run: the next identical message starts at 1 again.
  const forget = () => repeats.delete(id)
  const options = { id, description: detail, duration: kind === 'error' ? Infinity : 5000, onDismiss: forget, onAutoClose: forget }
  const text = n > 1 ? `${message} · +${n - 1}` : message
  if (kind === 'error') toast.error(text, options)
  else if (kind === 'success') toast.success(text, options)
  else toast(text, options)
}

export const notify = {
  info: (message: string) => show('info', message),
  success: (message: string) => show('success', message),
  /** `detail` is the "Error code …" line from ErrorState's wording; errors never close by themselves (R15). */
  error: (message: string, detail: string) => show('error', message, detail),
}
