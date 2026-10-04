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
  onOpen?: () => void
  isDeleting?: boolean
}

export function TaskItem({
  task,
  onToggleComplete,
  onRename,
  onDelete,
  onOpen,
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

  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  }

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest('button') ||
      target.closest('[role="menu"]') ||
      isEditing
    ) return
    onOpen?.()
  }

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ') && !isEditing) {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`group flex items-center gap-4 px-6 py-4 border-b border-border/20 transition-all duration-200 ${
        task.completed ? 'bg-muted/30 hover:bg-muted/40' : 'hover:bg-muted/25'
      } ${isDeleting ? 'animate-out slide-out-to-right fade-out' : 'animate-in'} ${onOpen ? 'cursor-pointer' : ''}`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggleComplete}
        disabled={isToggling || isDeleting}
        className="h-5 w-5 shrink-0 rounded border border-border text-primary cursor-pointer disabled:opacity-50 transition-all duration-200 accent-primary"
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
          className="flex-1 min-w-0 px-3 py-2 text-base bg-background border border-primary/40 rounded-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-transparent transition-all duration-200"
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 min-w-0 text-base cursor-text select-none transition-all duration-200 ${
            task.completed
              ? 'line-through text-muted-foreground'
              : 'text-foreground'
          }`}
          title="Double-click to edit"
        >
          {task.title}
        </div>
      )}

      {/* Metadata: priority, due date - right aligned */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {/* Priority badge */}
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 ${
            priorityColors[task.priority as keyof typeof priorityColors]
          } opacity-70 group-hover:opacity-100`}
          title={`Priority: ${task.priority}`}
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </span>

        {/* Due date */}
        {dueText && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-200 opacity-70 group-hover:opacity-100 ${
              isOverdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-muted text-muted-foreground'
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
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all rounded-lg disabled:opacity-50"
            aria-label={`Actions for task "${task.title}"`}
            disabled={isDeleting}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
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
