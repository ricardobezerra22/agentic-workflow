'use client'

import { useState, useRef, useEffect } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { TaskPriority, CreateTaskInput } from '@/features/tasks/types'

interface InlineTaskCreatorProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function InlineTaskCreator({ onSubmit, onCancel, loading = false }: InlineTaskCreatorProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
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
    <div className="bg-muted/20 border-b border-border/20 px-6 py-4 animate-in slide-in-from-top-2 fade-in rounded-lg mx-6 my-4 shadow-notion-sm">
      <div className="flex items-center gap-4">
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
          className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 transition-colors duration-200"
          aria-label="New task title"
        />

        {/* Priority dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-background/50 transition-colors duration-200 disabled:opacity-50"
              title="Set priority"
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
              <DropdownMenuItem
                key={p}
                onClick={() => setPriority(p)}
                className={priority === p ? 'bg-primary/10' : ''}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save/Cancel */}
        <div className="flex gap-2 ml-2">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            size="sm"
            variant="primary"
            className="px-4 py-2 text-sm font-medium"
          >
            Save
          </Button>
          <Button
            onClick={onCancel}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="px-4 py-2 text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
