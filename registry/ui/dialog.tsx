import { X } from 'lucide-react'
import { Dialog as D } from 'radix-ui'
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Text } from '@/registry/patterns/text'
import { Button, IconButton, PrimaryScope } from '@/registry/ui/button'

export type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** The form has unsaved changes: every way of closing asks first (R15). */
  dirty?: boolean
  /** Something is being submitted: closing waits until it finishes (R15). */
  busy?: boolean
  footer: ReactNode
  children: ReactNode
}

// Release of a dialog's history entry is deferred one tick so that a dialog opening in the same handler can take the entry over.
const closing = new Map<string, ReturnType<typeof setTimeout>>()
// Number of back() calls we made that have not produced their popstate yet: those pops are ours, not the user's.
let ownBacks = 0
const mine = (id: string) => (history.state as { agentUiDialog?: string } | null)?.agentUiDialog === id

/** Back closes the dialog: opening adds one history entry; closing any other way removes it again.
 *  The entry is tagged with this dialog's id and only removed while it is still the current one, so a
 *  navigation made in the same handler as the close is never undone. */
function useBackCloses(open: boolean, requestClose: () => boolean) {
  const id = useId()
  const close = useRef(requestClose)
  useEffect(() => { close.current = requestClose })
  useEffect(() => {
    if (!open) return
    // Add the tag to whatever the current entry holds (React Router keeps {key, idx} there) instead of replacing it.
    const tag = () => ({ ...(typeof history.state === 'object' ? history.state : {}), agentUiDialog: id })
    const current = (history.state as { agentUiDialog?: string } | null)?.agentUiDialog
    // Reopened before the deferred release ran (StrictMode, or reopen in the same macrotask): cancel it in every case,
    // otherwise it would later pop an entry that was pushed again for this open.
    if (closing.has(id)) { clearTimeout(closing.get(id)); closing.delete(id) }
    if (mine(id)) {
      // The entry is still ours (StrictMode remount).
    } else if (current && closing.has(current)) {
      // Another dialog is closing in this same tick: reuse its entry instead of stacking a second one.
      clearTimeout(closing.get(current)); closing.delete(current)
      history.replaceState(tag(), '')
    } else {
      history.pushState(tag(), '')
    }
    const onPop = () => {
      if (ownBacks > 0) return
      // Closing was refused (dirty or busy): put the entry back so the next Back is handled here too.
      if (!close.current()) history.pushState(tag(), '')
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // Runs on close and on unmount while open.
      closing.set(id, setTimeout(() => {
        closing.delete(id)
        if (mine(id)) {
          // Listeners of dialogs open at that moment run first and see the counter; this one then clears it.
          ownBacks++
          addEventListener('popstate', () => { ownBacks-- }, { once: true })
          history.back()
        }
      }, 0))
    }
  }, [open, id])
}

/** Keep Dialog mounted and drive it with `open` (unmounting while open is handled, but `open` is the supported way).
 *  Closing and then navigating or opening another dialog in the same handler is safe; doing it one macrotask later
 *  (after an await) can race the browser's Back traversal in a ~1-4 ms window.
 *  Nested dialogs are not supported: one Back closes both (no modal on top of a modal).
 *  If a close is followed by navigation in the same handler, the dialog's history entry stays behind (one extra Back). */
export function Dialog({ open, onOpenChange, title, description, dirty = false, busy = false, footer, children }: DialogProps) {
  const t = useT()
  const [confirming, setConfirming] = useState(false)
  // Dialog is controlled and has no Radix Trigger, so Radix cannot know where focus should return: remember it.
  const opener = useRef<HTMLElement | null>(null)

  const requestClose = useCallback((): boolean => {
    if (busy) return false
    if (dirty) { setConfirming(true); return false }
    onOpenChange(false)
    return true
  }, [busy, dirty, onOpenChange])

  useBackCloses(open, requestClose)
  // A close from outside (parent set open=false) while the bar was showing must not leave it for the next open.
  if (!open && confirming) setConfirming(false)

  return (
    <D.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : void requestClose())}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0" />
        <D.Content
          {...(description ? {} : { 'aria-describedby': undefined })}
          // Focus the dialog, not ×: a focused × shows its tooltip and the first Esc would only close that (R16).
          onOpenAutoFocus={(e) => { e.preventDefault(); opener.current = document.activeElement as HTMLElement | null; (e.currentTarget as HTMLElement).focus() }}
          onCloseAutoFocus={(e) => { e.preventDefault(); opener.current?.focus() }}
          className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] rounded-lg border bg-background shadow-lg outline-none max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none"
        >
          {/* R9: header and footer stay put; only the body scrolls. */}
          <header className="flex items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <D.Title asChild><Text as="h2" overflow={{ clamp: 2 }} className="text-base font-semibold">{title}</Text></D.Title>
              {description && <D.Description asChild><Text as="p" overflow="wrap" className="mt-1 text-sm text-muted-foreground">{description}</Text></D.Description>}
            </div>
            <IconButton label={t('agentui.close')} variant="ghost" onClick={() => void requestClose()} disabled={busy}><X /></IconButton>
          </header>
          <div className="min-h-0 overflow-y-auto p-4">{children}</div>
          <footer className="border-t p-4">
            <PrimaryScope>
              {confirming ? (
                <div role="alertdialog" aria-label={t('agentui.discard.title')} className="flex flex-wrap items-center justify-between gap-3">
                  <Text as="p" overflow="wrap" className="text-sm font-medium">{t('agentui.discard.title')}</Text>
                  <div className="flex flex-wrap gap-2">
                    <Button autoFocus onClick={() => setConfirming(false)}>{t('agentui.discard.keep')}</Button>
                    <Button variant="destructive" onClick={() => { setConfirming(false); onOpenChange(false) }}>{t('agentui.discard.confirm')}</Button>
                  </div>
                </div>
              ) : footer}
            </PrimaryScope>
          </footer>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
