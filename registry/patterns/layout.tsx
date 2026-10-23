import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/registry/lib/utils'

const gaps = { 0: 'gap-0', 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6', 8: 'gap-8' } as const
const aligns = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' } as const
const justifies = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' } as const
type Gap = keyof typeof gaps
type Rest = Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

// R1: `*:min-w-0` lets every child shrink below its content width — the one rule that stops columns overlapping.
export function Stack({ direction = 'column', gap = 3, align, justify, wrap = false, as: As = 'div', className, children, ...rest }: Rest & {
  direction?: 'column' | 'row'
  gap?: Gap
  align?: keyof typeof aligns
  justify?: keyof typeof justifies
  wrap?: boolean
  as?: 'div' | 'ul' | 'ol' | 'section'
  className?: string
  children: ReactNode
}) {
  return (
    <As {...rest} className={cn('flex *:min-w-0', direction === 'row' ? 'flex-row' : 'flex-col', gaps[gap], align && aligns[align], justify && justifies[justify], wrap && 'flex-wrap', className)}>
      {children}
    </As>
  )
}

/** A grid whose tracks are `template` (e.g. "minmax(0,1fr) auto"); one column below 640 px by default. */
export function Columns({ template, gap = 4, collapseBelowSm = true, className, children, style, ...rest }: Rest & {
  template: string
  gap?: Gap
  collapseBelowSm?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      {...rest}
      style={{ ...style, '--agent-ui-cols': template } as CSSProperties}
      className={cn('grid *:min-w-0', gaps[gap], collapseBelowSm ? 'sm:[grid-template-columns:var(--agent-ui-cols)]' : '[grid-template-columns:var(--agent-ui-cols)]', className)}
    >
      {children}
    </div>
  )
}
