'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'default' | 'success' | 'error'
  action?: { label: string; onClick: () => void | Promise<void> }
  duration?: number
  onDismiss: () => void
}

export function Toast({
  message,
  type = 'default',
  action,
  duration = 4000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    if (duration && !action) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, action, onDismiss])

  const bgColor = {
    default: 'bg-background border border-border',
    success: 'bg-success/10 border border-success/30',
    error: 'bg-destructive/10 border border-destructive/30',
  }[type]

  const textColor = {
    default: 'text-foreground',
    success: 'text-success',
    error: 'text-destructive',
  }[type]

  return (
    <div
      className={`animate-in slide-in-from-bottom-3 fade-in ${bgColor} rounded-lg px-4 py-3 flex items-center justify-between gap-3 shadow-sm`}
      role="status"
      aria-live="polite"
    >
      <span className={`text-sm ${textColor}`}>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary hover:text-primary/80 whitespace-nowrap"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
