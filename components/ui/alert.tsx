import * as React from 'react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'error' | 'success' | 'warning' | 'info'
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', type = 'info', icon, children, ...props }, ref) => {
    const typeStyles = {
      error: 'border-destructive/50 bg-destructive/5 text-destructive',
      success: 'border-success/50 bg-success/5 text-success',
      warning: 'border-amber-500/50 bg-amber-500/5 text-amber-700',
      info: 'border-primary/50 bg-primary/5 text-primary',
    }

    const typeIcons = {
      error: '⚠️',
      success: '✓',
      warning: '⚠️',
      info: 'ℹ️',
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={`flex items-start gap-3 rounded-md border p-4 text-sm ${typeStyles[type]} ${className}`}
        {...props}
      >
        <span className="shrink-0 text-lg">{icon || typeIcons[type]}</span>
        <div>{children}</div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export { Alert }
