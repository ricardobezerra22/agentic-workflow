import * as React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = true, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border border-border bg-background p-4 transition-all duration-150 ${
        hoverable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'shadow-sm'
      } ${className}`}
      {...props}
    />
  )
)

Card.displayName = 'Card'

export { Card }
