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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/75 border-b border-border/20 shadow-notion-sm">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:px-8">
        {/* Header row: title + actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Tasks</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={onNewTask}
              className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/8 rounded-lg transition-colors duration-200 hover:text-primary/90"
              aria-label="Create new task"
              title="Press N to create new task"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>

            <button
              onClick={onFilterToggle}
              className={`inline-flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                hasActiveFilters
                  ? 'bg-primary/12 text-primary hover:bg-primary/16'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              aria-label="Toggle filters"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
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
            className="w-full px-4 py-3 text-sm bg-muted/50 border border-border/30 rounded-xl text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-transparent transition-all duration-200 hover:bg-muted/60 hover:border-border/40"
            aria-label="Search tasks"
            title="Press Cmd/Ctrl+K to focus search"
          />
          <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
