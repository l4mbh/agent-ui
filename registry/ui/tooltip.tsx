import { Tooltip as T } from 'radix-ui'
import type { ReactElement, ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <T.Provider delayDuration={300}>{children}</T.Provider>
}

/** Closes on Esc and pointer leave (R15). Long tooltip text wraps inside a bounded width. */
export function Tooltip({ content, children, wrapTrigger = false }: { content: ReactNode; children: ReactElement; wrapTrigger?: boolean }) {
  return (
    <T.Provider delayDuration={300}>
    <T.Root>
      {/* A disabled button gets no hover/focus, so the tooltip hangs on a wrapping span. */}
      <T.Trigger asChild>{wrapTrigger ? <span tabIndex={0} className="inline-flex">{children}</span> : children}</T.Trigger>
      <T.Portal>
        <T.Content sideOffset={6} collisionPadding={8} className="z-50 max-w-72 rounded-md bg-foreground px-2 py-1 text-xs text-background [overflow-wrap:anywhere] animate-in fade-in-0">
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
    </T.Provider>
  )
}
