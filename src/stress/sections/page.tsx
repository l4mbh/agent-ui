import { useState } from 'react'
import { useLocale, useT } from '@/registry/i18n/i18n'
import { ActionBar } from '@/registry/patterns/action-bar'
import { PageHeader, Steps } from '@/registry/patterns/page-header'
import { PrimaryScope } from '@/registry/ui/button'
import { long } from '@/stress/strings'

const noop = () => {}

export function PageSection() {
  const t = useT()
  const [fired, setFired] = useState(0)
  const s = long[useLocale()]
  return (
    <PrimaryScope>
      <PageHeader
        title={s.title}
        description={t('stress.page.waiting')}
        actions={<ActionBar
          primary={{ id: 'remind', label: t('stress.button.remind'), onSelect: noop }}
          secondary={[
            { id: 'confirm', label: t('stress.page.confirmNow'), onSelect: noop },
            { id: 'wait', label: t('stress.menu.wait'), onSelect: noop },
            { id: 'busy', label: t('stress.page.busy'), onSelect: () => setFired((n) => n + 1), loading: true, testId: 'busy-action' },
            { id: 'cancel', label: t('stress.page.cancel'), onSelect: noop, destructive: true },
          ]}
        />}
      />
      <Steps steps={[
        { label: t('stress.page.step1'), state: 'done' },
        { label: t('stress.page.step2'), detail: s.sentence, state: 'current' },
        { label: t('stress.page.step3'), state: 'todo' },
      ]} />
      <span data-testid="busy-fired" className="sr-only">{fired}</span>
    </PrimaryScope>
  )
}
