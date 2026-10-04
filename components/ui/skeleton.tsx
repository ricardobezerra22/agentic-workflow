import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height = 16,
  style,
  ...props
}) => (
  <div
    className={`animate-pulse rounded bg-muted ${className}`}
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    }}
    {...props}
  />
)

Skeleton.displayName = 'Skeleton'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', ...props }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-muted border-t-primary ${sizeMap[size]} ${className}`}
      {...props}
    />
  )
}

Spinner.displayName = 'Spinner'

export { Skeleton, Spinner }
