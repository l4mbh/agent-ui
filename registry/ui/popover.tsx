import { X } from 'lucide-react'
import { Popover as P } from 'radix-ui'
import type { ReactNode } from 'react'
import { useT } from '@/registry/i18n/i18n'
import { Text } from '@/registry/patterns/text'
import { IconButton } from '@/registry/ui/button'

export const Popover = P.Root
export const PopoverTrigger = P.Trigger

/** R15: focus lands on the popover, not on ×, so the × tooltip does not open and swallow the first Esc.
 *  × (labelled), Esc and click outside all close it; Radix returns focus to the trigger. */
export function PopoverContent({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <P.Portal>
      <P.Content role="dialog" onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).focus() }} aria-label={title} sideOffset={4} collisionPadding={8} className="z-50 w-[min(24rem,calc(100vw-1rem))] rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Text as="h3" overflow="truncate" className="text-sm font-semibold">{title}</Text>
          <P.Close asChild><IconButton label={t('agentui.close')} variant="ghost"><X /></IconButton></P.Close>
        </div>
        {children}
      </P.Content>
    </P.Portal>
  )
}
