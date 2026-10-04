'use client'

import { useRef } from 'react'

interface TaskHeaderProps {
  onSearchChange: (value: string) => void
  searchValue: string
  onNewTask: () => void
  onFilterToggle: () => void
  hasActiveFilters: boolean
}

export function TaskHeader({
  onSearchChange,
  searchValue,
  onNewTask,
  onFilterToggle,
  hasActiveFilters,
}: TaskHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
      <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
        {/* Header row: title + actions */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Tasks</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={onNewTask}
              className="px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              aria-label="Create new task"
              title="Press N to create new task"
            >
              + New
            </button>

            <button
              onClick={onFilterToggle}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                hasActiveFilters
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
              aria-label="Toggle filters"
            >
              {hasActiveFilters ? '⊕ Filters' : 'Filter'}
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border/30 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Search tasks"
            title="Press Cmd/Ctrl+K to focus search"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            ⌕
          </span>
        </div>
      </div>
    </div>
  )
}
