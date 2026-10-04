'use client'

import { TaskCard } from './TaskCard'
import type { Task } from '@/features/tasks/types'

interface TaskListProps {
  tasks: Task[]
  loading?: boolean
  error?: string | null
  onEdit: (task: Task) => void
  onToggleComplete: (taskId: number, completed: boolean) => Promise<void>
  onDelete: (taskId: number, taskTitle: string) => Promise<void>
}

export function TaskList({
  tasks,
  loading = false,
  error,
  onEdit,
  onToggleComplete,
  onDelete,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No tasks found. Try adjusting your filters.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
