'use client'

import { Button } from '@/components/ui/button'

interface TaskEmptyStateProps {
  onCreateClick: () => void
}

export function TaskEmptyState({ onCreateClick }: TaskEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 py-12 text-center">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No tasks yet</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating your first task
        </p>
      </div>
      <Button onClick={onCreateClick} className="mt-6">
        Create your first task
      </Button>
    </div>
  )
}
