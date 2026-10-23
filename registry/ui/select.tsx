import { Check, ChevronDown } from 'lucide-react'
import { Select as S } from 'radix-ui'

export type SelectOption = { value: string; label: string }

/** A labelled select whose options are as wide as the trigger and truncate with a title (R2, R4). */
export function Select({ label, value, onValueChange, options, placeholder, disabled, 'data-testid': testId }: {
  label: string
  value?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  'data-testid'?: string
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <S.Trigger data-testid={testId} aria-label={label} className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 data-[placeholder]:text-muted-foreground">
        <span className="min-w-0 truncate"><S.Value placeholder={placeholder} /></span>
        <S.Icon asChild><ChevronDown className="size-4 shrink-0 opacity-60" /></S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content position="popper" sideOffset={4} collisionPadding={8} className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) max-w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item key={o.value} value={o.value} className="relative block w-full min-w-0 cursor-default select-none rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground">
                <S.ItemText><span className="block min-w-0 truncate" title={o.label}>{o.label}</span></S.ItemText>
                <S.ItemIndicator className="absolute right-2 top-1/2 inline-flex -translate-y-1/2"><Check className="size-4" /></S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
