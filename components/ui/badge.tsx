import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'medium' | 'high' | 'default'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-red-100 text-red-800',
      default: 'bg-muted text-muted-foreground',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
