'use client'

import { useRef, useEffect } from 'react'
import type { TaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskStatus, TaskPriority } from '@/features/tasks/types'

interface FilterPopoverProps {
  isOpen: boolean
  onClose: () => void
  filters: TaskFilters
  onFilterChange: (updates: Partial<TaskFilters>) => void
  onClearFilters: () => void
}

export function FilterPopover({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
}: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const statusOptions: Array<{ value: TaskStatus; label: string }> = [
    { value: 'all', label: 'All tasks' },
    { value: 'open', label: 'Open' },
    { value: 'done', label: 'Completed' },
  ]

  const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]

  const hasActiveFilters = filters.priority !== '' || filters.q !== ''

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2"
    >
      <div className="p-3 space-y-4">
        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            Status
          </label>
          <div className="flex flex-col gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ status: option.value })}
                className={`text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                  filters.status === option.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-muted border border-border/30 rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <option value="">All priorities</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onClearFilters()
              onClose()
            }}
            className="w-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
