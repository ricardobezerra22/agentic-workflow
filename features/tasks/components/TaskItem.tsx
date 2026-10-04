'use client'

import { useState, useRef, useEffect } from 'react'
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

      {/* Quick delete button */}
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="px-2 py-1 text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        aria-label={`Delete task "${task.title}"`}
        title="Delete task"
      >
        ✕
      </button>
    </div>
  )
}
