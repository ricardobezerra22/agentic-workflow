'use client'

import * as React from 'react'
import { Button } from './button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  primaryAction?: {
    label: string
    onClick: () => void | Promise<void>
    variant?: 'danger' | 'primary'
    isLoading?: boolean
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-200"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="w-full max-w-md rounded-lg bg-background shadow-lg">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>

        {children && <div className="px-6 py-4">{children}</div>}

        <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant || 'primary'}
              onClick={primaryAction.onClick}
              isLoading={primaryAction.isLoading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

Dialog.displayName = 'Dialog'

export { Dialog }
