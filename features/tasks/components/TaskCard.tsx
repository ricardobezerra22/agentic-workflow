'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskDeleteDialog } from './TaskDeleteDialog'
import type { Task, TaskPriority } from '@/features/tasks/types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onToggleComplete: (taskId: number, completed: boolean) => Promise<void>
  onDelete: (taskId: number, taskTitle: string) => Promise<void>
}

const priorityMap: Record<TaskPriority, 'low' | 'medium' | 'high'> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

export function TaskCard({ task, onEdit, onToggleComplete, onDelete }: TaskCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(task.id, task.title)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue =
    !task.completed &&
    task.dueDate &&
    new Date(task.dueDate) < new Date()

  return (
    <>
      <Card className="flex items-center gap-4 p-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onToggleComplete(task.id, e.target.checked)}
          className="h-5 w-5 cursor-pointer rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-foreground truncate ${
              task.completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-2">
          <Badge variant={priorityMap[task.priority as TaskPriority]}>
            {task.priority}
          </Badge>

          {task.dueDate && (
            <span
              className={`text-xs font-medium px-2 py-1 rounded ${
                isOverdue
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            aria-label={`Edit task "${task.title}"`}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            aria-label={`Delete task "${task.title}"`}
          >
            Delete
          </Button>
        </div>
      </Card>

      <TaskDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        taskTitle={task.title}
        loading={deleting}
      />
    </>
  )
}
