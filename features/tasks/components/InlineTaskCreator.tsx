'use client'

import { useState, useRef, useEffect } from 'react'
import type { TaskPriority, CreateTaskInput } from '@/features/tasks/types'

interface InlineTaskCreatorProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function InlineTaskCreator({ onSubmit, onCancel, loading = false }: InlineTaskCreatorProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [showPrioritySelect, setShowPrioritySelect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (!title.trim()) return

    try {
      await onSubmit({
        title: title.trim(),
        priority,
      })
      setTitle('')
      setPriority('medium')
    } catch (err) {
      // Error handled by parent
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="bg-muted/30 border-b border-border/30 px-4 py-3 animate-in slide-in-from-top-2 fade-in">
      <div className="flex items-center gap-3">
        {/* Checkbox (unchecked state) */}
        <div className="h-5 w-5 shrink-0 rounded border-2 border-muted-foreground/30" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="What needs to be done?"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50"
          aria-label="New task title"
        />

        {/* Priority select */}
        <div className="relative">
          <button
            onClick={() => setShowPrioritySelect(!showPrioritySelect)}
            disabled={loading}
            className="px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-background transition-colors disabled:opacity-50"
            title="Set priority"
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>

          {showPrioritySelect && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-background border border-border rounded-lg shadow-lg z-50">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPriority(p)
                    setShowPrioritySelect(false)
                  }}
                  className={`block w-full text-left px-3 py-1.5 text-xs ${
                    priority === p
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Save/Cancel */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
