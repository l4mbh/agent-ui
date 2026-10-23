import { useRef, useState } from 'react'
import { useLocale, useT } from '@/registry/i18n/i18n'
import { ActionBar } from '@/registry/patterns/action-bar'
import { Stack } from '@/registry/patterns/layout'
import { Text } from '@/registry/patterns/text'
import { Button } from '@/registry/ui/button'
import { Dialog } from '@/registry/ui/dialog'
import { long } from '@/stress/strings'

export function DialogSection() {
  const t = useT()
  const s = long[useLocale()]
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = () => { setBusy(true); setTimeout(() => { setBusy(false) }, 1500) }
  return (
    <>
      <Button data-testid="dialog-trigger" onClick={() => { setText(''); setOpen(true) }}>{t('stress.dialog.open')}</Button>
      <Dialog open={open} onOpenChange={setOpen} title={s.title} description={t('stress.dialog.description')} dirty={text !== ''} busy={busy}
        footer={<ActionBar primary={{ id: 'save', testId: 'dialog-submit', label: t('stress.dialog.save'), onSelect: submit, loading: busy }} />}>
        <Stack gap={3}>
          <Button variant="outline" data-testid="dialog-force-close" onClick={() => setOpen(false)}>{t('stress.dialog.close')}</Button>
          <input aria-label={t('stress.dialog.field')} value={text} onChange={(e) => setText(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
          {/* A long form: the footer button must still be on screen (R9). */}
          {Array.from({ length: 30 }, (_, i) => <Text key={i} as="p" overflow="wrap" className="text-sm">{s.sentence}</Text>)}
        </Stack>
      </Dialog>
      <FlowDialogs />
    </>
  )
}

/** Two ways a handler can close a dialog and do something else in the same tick (history must stay consistent). */
function FlowDialogs() {
  const t = useT()
  const [a, setA] = useState(false)
  const [b, setB] = useState(false)
  const [c, setC] = useState(false)
  const reopened = useRef(false)
  return (
    <>
      <Button variant="outline" data-testid="flow-trigger" onClick={() => setA(true)}>{t('stress.dialog.flow')}</Button>
      <Dialog open={a} onOpenChange={setA} title={t('stress.dialog.flow')}
        footer={<Stack direction="row" gap={2} wrap>
          <Button variant="outline" data-testid="flow-next" onClick={() => { setA(false); setB(true) }}>{t('stress.dialog.next')}</Button>
          <Button data-testid="flow-nav" onClick={() => { setA(false); history.pushState({}, '', '?step=2') }}>{t('stress.dialog.nav')}</Button>
        </Stack>}>
        <Text as="p" overflow="wrap" className="text-sm">{t('stress.dialog.description')}</Text>
      </Dialog>
      <Button variant="outline" data-testid="reopen-trigger" onClick={() => { reopened.current = false; setC(true) }}>{t('stress.dialog.reopen')}</Button>
      {/* Reopens once, one macrotask after the close: the history entry must survive that. */}
      <Dialog open={c} onOpenChange={(o) => { setC(o); if (!o && !reopened.current) { reopened.current = true; setTimeout(() => setC(true), 0) } }} title={t('stress.dialog.reopen')}
        footer={<Button data-testid="reopen-done" onClick={() => setC(false)}>{t('stress.dialog.done')}</Button>}>
        <Text as="p" overflow="wrap" className="text-sm">{t('stress.dialog.description')}</Text>
      </Dialog>
      <Dialog open={b} onOpenChange={setB} title={t('stress.dialog.second')}
        footer={<Button data-testid="flow-done" onClick={() => setB(false)}>{t('stress.dialog.done')}</Button>}>
        <Text as="p" overflow="wrap" className="text-sm">{t('stress.dialog.description')}</Text>
      </Dialog>
    </>
  )
}
