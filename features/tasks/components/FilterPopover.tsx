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
        'absolute top-full right-0 mt-3 w-64 bg-background border border-border/30 rounded-xl shadow-notion-md z-50 p-5',
        'animate-in fade-in slide-in-from-top-2'
      )}
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Status
          </label>
          <div className="flex flex-col gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onFilterChange({ status: option.value })
                }}
                className={`text-left px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                  filters.status === option.value
                    ? 'bg-primary/12 text-primary font-medium'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/20 pt-4">
          <label htmlFor="filter-priority" className="block text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Priority
          </label>
          <Select value={filters.priority} onValueChange={(value) => onFilterChange({ priority: value })}>
            <SelectTrigger id="filter-priority" className="w-full h-10 rounded-lg">
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
            className="w-full mt-2 text-xs font-medium"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
