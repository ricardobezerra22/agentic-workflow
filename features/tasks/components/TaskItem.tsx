'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Task } from '@/features/tasks/types'

interface TaskItemProps {
  task: Task
  onToggleComplete: (completed: boolean) => Promise<void>
  onRename: (newTitle: string) => Promise<void>
  onDelete: () => void
  isDeleting?: boolean
}

const priorityDots = {
  high: '🔴',
  medium: '🟡',
  low: '⚪',
}

export function TaskItem({
  task,
  onToggleComplete,
  onRename,
  onDelete,
  isDeleting = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [isToggling, setIsToggling] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSaveRename = async () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.title) {
      await onRename(trimmed)
    }
    setIsEditing(false)
    setEditValue(task.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(task.title)
    }
  }

  const handleToggleComplete = async () => {
    setIsToggling(true)
    try {
      await onToggleComplete(!task.completed)
    } finally {
      setIsToggling(false)
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  const dueText = formatDate(task.dueDate)

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 border-b border-border/30 transition-all duration-200 ${
        task.completed ? 'bg-muted/20' : 'hover:bg-muted/30'
      } ${isDeleting ? 'animate-out slide-out-to-right fade-out' : 'animate-in'}`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggleComplete}
        disabled={isToggling || isDeleting}
        className="h-5 w-5 shrink-0 rounded border-border text-primary cursor-pointer disabled:opacity-50"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Title (inline editable) */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveRename}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 px-2 py-1 text-sm bg-background border border-primary/30 rounded text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 min-w-0 text-sm cursor-text select-none ${
            task.completed
              ? 'line-through text-muted-foreground'
              : 'text-foreground'
          }`}
          title="Double-click to edit"
        >
          {task.title}
        </div>
      )}

      {/* Metadata: priority, due date */}
      <div className="flex items-center gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <span
          className="text-xs"
          title={`Priority: ${task.priority}`}
          aria-label={`Priority: ${task.priority}`}
        >
          {priorityDots[task.priority as keyof typeof priorityDots]}
        </span>

        {dueText && (
          <span
            className={`text-xs font-medium ${
              isOverdue
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          >
            {dueText}
          </span>
        )}
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="px-1 py-0.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-muted disabled:opacity-50"
            aria-label={`Actions for task "${task.title}"`}
            disabled={isDeleting}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="18" cy="12" r="1.5" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
