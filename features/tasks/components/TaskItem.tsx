'use client'

import { useState, useRef, useEffect } from 'react'
import type { Task } from '@/features/tasks/types'

interface TaskItemProps {
  task: Task
  onToggleComplete: (completed: boolean) => Promise<void>
  onRename: (newTitle: string) => Promise<void>
  onDelete: () => void
  onOpen?: () => void
  isDeleting?: boolean
}

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#FF3B30',   /* iOS red */
  medium: '#FF9500',   /* iOS orange */
  low:    '#8E8E93',   /* iOS gray */
}

export function TaskItem({
  task,
  onToggleComplete,
  onRename,
  onDelete,
  onOpen,
  isDeleting = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing]   = useState(false)
  const [editValue, setEditValue]   = useState(task.title)
  const [isToggling, setIsToggling] = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.focus(), inputRef.current?.select()
  }, [isEditing])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const handleSaveRename = async () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.title) await onRename(trimmed)
    setIsEditing(false)
    setEditValue(task.title)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveRename()
    else if (e.key === 'Escape') { setIsEditing(false); setEditValue(task.title) }
  }

  const handleToggleComplete = async () => {
    setIsToggling(true)
    try { await onToggleComplete(!task.completed) }
    finally { setIsToggling(false) }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const date     = new Date(dateStr)
    const today    = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === today.toDateString())    return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
  const dueText   = formatDate(task.dueDate)

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement
    if (t.closest('input') || t.closest('button') || t.closest('[role="menu"]') || isEditing) return
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
      className={[
        'group flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-border/50 transition-colors bg-muted',
        task.completed ? 'opacity-55' : '',
        isDeleting ? 'animate-out slide-out-to-right fade-out' : 'animate-in',
        onOpen ? 'cursor-pointer' : '',
        'hover:bg-background/60',
      ].join(' ')}
    >
      {/* Priority strip — thin vertical accent */}
      <div
        className="w-0.5 h-4 rounded-full shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: PRIORITY_COLOR[task.priority] ?? '#4a4845' }}
        aria-hidden
      />

      {/* Custom circular checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggleComplete}
        disabled={isToggling || isDeleting}
        className="task-checkbox"
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Title — inline-editable on double-click */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveRename}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 px-2 py-1 text-sm bg-muted/60 border-b border-primary text-foreground focus:outline-none"
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 min-w-0 text-sm select-none cursor-text ${
            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
          }`}
          title="Double-click to rename"
        >
          {task.title}
        </div>
      )}

      {/* Metadata: due date + priority label */}
      <div className="flex items-center gap-4 shrink-0 ml-auto opacity-40 group-hover:opacity-80 transition-opacity">
        {dueText && (
          <span
            className={`text-xs tabular-nums font-mono ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {dueText}
          </span>
        )}
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: PRIORITY_COLOR[task.priority] ?? '#4a4845' }}
          aria-label={`Priority: ${task.priority}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Actions menu — custom CSS dropdown, no Radix */}
      <div ref={menuRef} className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o) }}
          className="p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all rounded-sm disabled:opacity-30"
          aria-label={`Actions for "${task.title}"`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={isDeleting}
        >
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5"  cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="task-menu" role="menu">
            <button
              role="menuitem"
              onClick={() => { setIsEditing(true); setMenuOpen(false) }}
            >
              Rename
            </button>
            <button
              role="menuitem"
              className="danger"
              onClick={() => { onDelete(); setMenuOpen(false) }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
