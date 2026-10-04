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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        {/* Title + actions */}
        <div className="flex items-end justify-between pt-10 pb-5">
          <h1
            className="text-5xl font-semibold text-foreground leading-none tracking-tight"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
          >
            Tasks
          </h1>

          <div className="flex items-center gap-2 pb-1">
            <button
              onClick={onNewTask}
              className="px-4 py-2 text-sm font-semibold rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all"
              aria-label="Create new task"
              title="Press N to create new task"
            >
              + New
            </button>

            <button
              onClick={onFilterToggle}
              className={`px-4 py-2 text-sm font-semibold rounded-[10px] border transition-all ${
                hasActiveFilters
                  ? 'border-primary/50 bg-primary/15 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label="Toggle filters"
            >
              {hasActiveFilters ? '● Filter' : 'Filter'}
            </button>
          </div>
        </div>

        {/* Search — underline-only style */}
        <div className="pb-5">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full py-2.5 px-4 pr-10 text-sm bg-muted rounded-[10px] border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              aria-label="Search tasks"
              title="Press Cmd/Ctrl+K to focus"
            />
            <svg
              className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
