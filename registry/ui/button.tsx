import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/registry/lib/utils'
import { Tooltip } from '@/registry/ui/tooltip'

// R7: states change colour and shadow only — never weight, border width or padding — so the box never moves.
export const buttonVariants = cva(
  'relative inline-flex max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        destructive: 'bg-destructive text-white dark:text-background hover:bg-destructive/90 active:bg-destructive/80',
      },
      size: { sm: 'h-8 px-3', md: 'h-9 px-4', lg: 'h-10 px-6', icon: 'size-9' },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

const PrimaryContext = createContext<{ register: () => () => void } | null>(null)

/** R14: one primary action per view. Wrap each page and each dialog footer. */
export function PrimaryScope({ children }: { children: ReactNode }) {
  const count = useRef(0)
  const value = useMemo(() => ({
    register() {
      count.current += 1
      if (import.meta.env.DEV && count.current > 1) console.error('agent-ui R14: more than one primary button in one view')
      return () => { count.current -= 1 }
    },
  }), [])
  return <PrimaryContext.Provider value={value}>{children}</PrimaryContext.Provider>
}

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { loading?: boolean }

export function Button({ className, variant, size, loading = false, type = 'button', onClick, title, children, ...props }: ButtonProps) {
  const scope = useContext(PrimaryContext)
  useEffect(() => (variant === 'primary' && scope ? scope.register() : undefined), [variant, scope])
  const label = typeof children === 'string' ? children : undefined
  return (
    <button
      type={type}
      data-variant={variant ?? 'secondary'}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      title={title ?? label}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {/* The label keeps its space while loading, so the button does not shrink to the spinner (R7). */}
      <span className={cn('inline-flex min-w-0 items-center gap-2', loading && 'opacity-0')}>
        {label ? <span className="min-w-0 truncate">{label}</span> : children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <LoaderCircle className="animate-spin" />
        </span>
      )}
    </button>
  )
}

/** R14: an icon on its own always has a name and a tooltip. */
export function IconButton({ label, children, ...props }: Omit<ButtonProps, 'size' | 'children'> & { label: string; children: ReactNode }) {
  return (
    <Tooltip content={label} wrapTrigger={props.disabled}>
      <Button size="icon" title={undefined} {...props} aria-label={label}>{children}</Button>
    </Tooltip>
  )
}
