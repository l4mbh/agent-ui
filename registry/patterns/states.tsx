import type { ReactNode } from 'react'
import type { ResourceState } from '@/registry/hooks/use-resource'
import { useHasMessage, useT } from '@/registry/i18n/i18n'
import type { AppError } from '@/registry/lib/api'
import { Text } from '@/registry/patterns/text'
import { Button } from '@/registry/ui/button'

/** R10, R14: an empty area says why it is empty and what to do next. */
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
      <Text as="p" overflow="wrap" className="text-sm font-medium">{title}</Text>
      <Text as="p" overflow="wrap" className="max-w-prose text-sm text-muted-foreground">{description}</Text>
      {action}
    </div>
  )
}

/**
 * R10: the one error map, shared by ErrorState and toasts: the app's `errors.<CODE>` message (or the
 * generic sentence for any other code) plus the "Error code …" line the user quotes back.
 */
export function useErrorText(): (error: AppError) => { sentence: string; codeLine: string } {
  const t = useT()
  const has = useHasMessage()
  return (error) => {
    const key = `errors.${error.code}`
    return { sentence: has(key) ? t(key) : t('agentui.error.generic'), codeLine: t('agentui.error.code', { code: error.code }) }
  }
}

/** R10: a friendly sentence and the code to quote (see useErrorText). */
export function ErrorState({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  const t = useT()
  const { sentence, codeLine } = useErrorText()(error)
  return (
    <div role="alert" className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center">
      <Text as="p" overflow="wrap" className="max-w-prose text-sm font-medium">{sentence}</Text>
      <Text as="p" overflow="wrap" className="text-xs tabular-nums text-muted-foreground">{codeLine}</Text>
      {onRetry && <Button onClick={onRetry}>{t('agentui.retry')}</Button>}
    </div>
  )
}

/** R8: every data area handles all four states; before 200 ms the skeleton holds the space invisibly (no shift). */
export function Resource<T>({ value, skeleton, empty, children }: {
  value: ResourceState<T> & { reload: () => void }
  skeleton: ReactNode
  empty: ReactNode
  children: (data: T) => ReactNode
}) {
  const t = useT()
  switch (value.status) {
    case 'pending':
      return <div role="status" aria-busy="true" aria-label={t('agentui.loading')} className={value.showLoading ? undefined : 'invisible'}>{skeleton}</div>
    case 'error':
      return <ErrorState error={value.error} onRetry={value.reload} />
    case 'empty':
      return <>{empty}</>
    case 'data':
      return <>{children(value.data)}</>
  }
}
