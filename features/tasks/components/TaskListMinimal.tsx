'use client'

import { TaskItem } from './TaskItem'
import type { Task } from '@/features/tasks/types'

interface TaskListMinimalProps {
  tasks: Task[]
  loading?: boolean
  onToggleComplete: (taskId: number, completed: boolean) => Promise<void>
  onRename: (taskId: number, newTitle: string) => Promise<void>
  onDelete: (taskId: number) => void
  onOpen?: (taskId: number) => void
  deletingId?: number | null
}

export function TaskListMinimal({
  tasks,
  loading = false,
  onToggleComplete,
  onRename,
  onDelete,
  onOpen,
  deletingId,
}: TaskListMinimalProps) {
  if (loading && tasks.length === 0) {
    return (
      <div className="space-y-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-muted/30 animate-pulse rounded"
          />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No tasks found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/30">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={(completed) => onToggleComplete(task.id, completed)}
          onRename={(newTitle) => onRename(task.id, newTitle)}
          onDelete={() => onDelete(task.id)}
          onOpen={onOpen ? () => onOpen(task.id) : undefined}
          isDeleting={deletingId === task.id}
        />
      ))}
    </div>
  )
}
