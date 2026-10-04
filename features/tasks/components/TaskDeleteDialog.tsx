'use client'

import { LegacyDialog } from '@/components/ui/dialog'

interface TaskDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  taskTitle: string
  loading?: boolean
}

export function TaskDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  loading = false,
}: TaskDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <LegacyDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete task"
      description={`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`}
      primaryAction={{
        label: 'Delete',
        variant: 'danger',
        onClick: handleConfirm,
        isLoading: loading,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
      }}
    />
  )
}
