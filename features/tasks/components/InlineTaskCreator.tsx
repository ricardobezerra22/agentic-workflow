'use client'

import { useState, useRef, useEffect } from 'react'
import type { TaskPriority, CreateTaskInput } from '@/features/tasks/types'

const PRIORITY_COLOR: Record<string, string> = {
  high:   '#e55252',
  medium: '#f0a535',
  low:    '#4a4845',
}

interface InlineTaskCreatorProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function InlineTaskCreator({ onSubmit, onCancel, loading = false }: InlineTaskCreatorProps) {
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return
    try {
      await onSubmit({ title: title.trim(), priority })
      setTitle('')
      setPriority('medium')
    } catch {
      // parent handles error display
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    else if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="border-b border-primary/40 bg-muted/20 animate-in slide-in-from-top-2 fade-in">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 py-3 flex items-center gap-3">

        {/* Matches the priority strip in TaskItem */}
        <div
          className="w-0.5 h-4 rounded-full shrink-0"
          style={{ backgroundColor: PRIORITY_COLOR[priority] }}
          aria-hidden
        />

        {/* Ghost circle mimics the checkbox */}
        <div className="w-[17px] h-[17px] rounded-full border border-muted-foreground/25 shrink-0" />

        {/* Title input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="What needs to be done?"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          aria-label="New task title"
        />

        {/* Priority — plain native select, styled via .custom-select */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={loading}
          className="custom-select"
          aria-label="Task priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="btn-primary"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
