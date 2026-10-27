import { Switch as S } from 'radix-ui'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/registry/lib/utils'
import { Text } from '@/registry/patterns/text'
import { Tooltip } from '@/registry/ui/tooltip'

export type SwitchProps = Omit<ComponentProps<typeof S.Root>, 'children'> & {
  /** Always required: shown next to the switch, or with `hideLabel` its accessible name and tooltip (R14). */
  label: string
  hideLabel?: boolean
  /** Drawn inside the thumb, e.g. a sun or a moon. */
  icon?: ReactNode
}

// R7: states change colour, thumb position and the focus ring (a shadow) only, so the box never moves.
// The track is styled by aria-checked, not data-state: a Tooltip trigger overwrites the root's data-state.
export function Switch({ label, hideLabel = false, icon, id, className, ...props }: SwitchProps) {
  const autoId = useId()
  const root = (
    <S.Root
      id={id ?? autoId}
      aria-label={hideLabel ? label : undefined}
      className={cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 outline-none transition-[background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 bg-muted-foreground aria-checked:bg-primary', className)}
      {...props}
    >
      <S.Thumb className="pointer-events-none flex size-4 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform data-[state=checked]:translate-x-4 [&_svg]:size-3">
        {icon}
      </S.Thumb>
    </S.Root>
  )
  if (hideLabel) return <Tooltip content={label} wrapTrigger={props.disabled}>{root}</Tooltip>
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-2">
      {root}
      <label htmlFor={id ?? autoId} className="flex min-w-0 text-sm peer-disabled:opacity-50">
        <Text overflow="truncate">{label}</Text>
      </label>
    </span>
  )
}
