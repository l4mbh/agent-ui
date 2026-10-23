import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/registry/lib/utils'

export type Overflow = 'truncate' | 'wrap' | { clamp: number }
type Tag = 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'dt' | 'dd'

export type TextProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  /** R4: every piece of text in a constrained box must say what happens when it does not fit. */
  overflow: Overflow
  as?: Tag
  children: ReactNode
}

/**
 * truncate/clamp need a box: the default `span` truncates inline-block and stays on its line inside a sentence.
 * Pass `title` when children are not a plain string (the R4 check flags cut text without a title).
 */
export function Text({ overflow, as: As = 'span', title, className, style, children, ...rest }: TextProps) {
  const ref = useRef<HTMLElement>(null)
  const [clipped, setClipped] = useState(false)

  // The tooltip appears only while the text is actually cut, so short text does not get a redundant title.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || overflow === 'wrap') return
    const check = () => setClipped(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [overflow, children])

  const full = title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined)
  const clamp = typeof overflow === 'object' ? overflow.clamp : undefined

  return (
    <As
      ref={ref as never}
      title={clipped ? full : undefined}
      style={clamp ? { ...style, WebkitLineClamp: clamp } : style}
      className={cn(
        'min-w-0',
        overflow === 'truncate' && (As === 'span' ? 'inline-block max-w-full align-bottom truncate' : 'block truncate'),
        clamp && 'overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical]',
        overflow === 'wrap' && '[overflow-wrap:anywhere]',
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}

/** R6: digits that line up — times, dates, counts. */
export function Nums({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn('tabular-nums', className)}>{children}</span>
}
