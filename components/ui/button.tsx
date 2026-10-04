import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-primary',
        secondary: 'bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70 focus-visible:ring-primary',
        ghost: 'text-foreground hover:bg-muted active:bg-muted/70 focus-visible:ring-primary',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-base rounded-md',
        lg: 'px-6 py-3 text-lg rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      ref={ref}
      {...props}
    >
      {isLoading ? <span className="inline-block animate-spin mr-2">⟳</span> : null}
      {children}
    </button>
  )
)

Button.displayName = 'Button'

export { Button, buttonVariants }
