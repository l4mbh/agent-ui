import { DropdownMenu as M } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/registry/lib/utils'
import { Text } from '@/registry/patterns/text'

export const DropdownMenu = M.Root
export const DropdownMenuTrigger = M.Trigger

// R2: the menu is at least as wide as its trigger and every item stretches to the menu's width.
export function DropdownMenuContent({ className, align = 'start', ...props }: ComponentProps<typeof M.Content>) {
  return (
    <M.Portal>
      <M.Content
        align={align}
        sideOffset={4}
        collisionPadding={8}
        className={cn('z-50 flex min-w-[max(var(--radix-dropdown-menu-trigger-width),10rem)] max-w-[min(20rem,calc(100vw-1rem))] flex-col rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0', className)}
        {...props}
      />
    </M.Portal>
  )
}

export function DropdownMenuItem({ className, destructive = false, children, ...props }: ComponentProps<typeof M.Item> & { destructive?: boolean }) {
  return (
    <M.Item
      className={cn('flex w-full min-w-0 cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground', destructive && 'text-destructive data-[highlighted]:text-destructive', className)}
      {...props}
    >
      {typeof children === 'string' ? <Text overflow="truncate">{children}</Text> : children}
    </M.Item>
  )
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof M.Separator>) {
  return <M.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}
