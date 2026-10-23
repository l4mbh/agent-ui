import { useT } from '@/registry/i18n/i18n'
import { AppError } from '@/registry/lib/api'
import { Stack } from '@/registry/patterns/layout'
import { useErrorText } from '@/registry/patterns/states'
import { Button } from '@/registry/ui/button'
import { notify } from '@/registry/ui/toast'

export function ToastsSection() {
  const t = useT()
  const err = useErrorText()
  const failed = err(new AppError('SLOTS_FAILED'))
  return (
    <Stack direction="row" gap={2} wrap>
      <Button data-testid="toast-5" onClick={() => { for (let i = 0; i < 5; i++) notify.success(t('stress.toast.saved')) }}>{t('stress.toast.five')}</Button>
      <Button data-testid="toast-2" onClick={() => { for (let i = 0; i < 2; i++) notify.success(t('stress.toast.saved')) }}>{t('stress.toast.twice')}</Button>
      <Button data-testid="toast-1" onClick={() => notify.success(t('stress.toast.saved'))}>{t('stress.toast.once')}</Button>
      <Button data-testid="toast-different" onClick={() => { for (let i = 1; i <= 5; i++) notify.info(t('stress.toast.notified', { count: i })) }}>{t('stress.toast.different')}</Button>
      <Button data-testid="toast-error" onClick={() => notify.error(failed.sentence, failed.codeLine)}>{t('stress.toast.error')}</Button>
    </Stack>
  )
}
