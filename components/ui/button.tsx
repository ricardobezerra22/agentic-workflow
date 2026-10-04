import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variantStyles = {
      primary: 'bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
      secondary: 'bg-muted text-foreground hover:bg-muted/80 active:bg-muted/70',
      ghost: 'text-foreground hover:bg-muted active:bg-muted/70',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
    }

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-md',
      lg: 'px-6 py-3 text-lg rounded-md',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <span className="inline-block animate-spin mr-2">⟳</span> : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
