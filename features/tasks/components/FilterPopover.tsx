'use client'

import { useRef, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskStatus, TaskPriority } from '@/features/tasks/types'

interface FilterPopoverProps {
  isOpen: boolean
  onClose: () => void
  filters: TaskFilters
  onFilterChange: (updates: Partial<TaskFilters>) => void
  onClearFilters: () => void
}

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

export function FilterPopover({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
}: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const hasActiveFilters = filters.priority !== '' || filters.q !== ''

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

  return (
    <div
      ref={popoverRef}
      className={cn(
        'absolute top-full right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50 p-3',
        'animate-in fade-in slide-in-from-top-2'
      )}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            Status
          </label>
          <div className="flex flex-col gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onFilterChange({ status: option.value })
                }}
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

        <div>
          <label htmlFor="filter-priority" className="block text-xs font-semibold text-muted-foreground mb-2">
            Priority
          </label>
          <Select value={filters.priority} onValueChange={(value) => onFilterChange({ priority: value })}>
            <SelectTrigger id="filter-priority" className="w-full h-9">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All priorities</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              onClearFilters()
              onClose()
            }}
            className="w-full"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
