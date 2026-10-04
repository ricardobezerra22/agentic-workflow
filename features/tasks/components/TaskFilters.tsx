'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { TaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskStatus, TaskPriority } from '@/features/tasks/types'

interface TaskFiltersProps {
  filters: TaskFilters
  onFilterChange: (updates: Partial<TaskFilters>) => void
  onClearFilters: () => void
}

export function TaskFilters({ filters, onFilterChange, onClearFilters }: TaskFiltersProps) {
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
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="space-y-3">
        {/* Status filter */}
        <div>
          <label className="text-sm font-medium text-foreground">Status</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange({ status: option.value })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filters.status === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border border-border text-foreground hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority filter */}
        <div>
          <label htmlFor="priority-select" className="text-sm font-medium text-foreground">
            Priority
          </label>
          <select
            id="priority-select"
            value={filters.priority}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="">All priorities</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <Input
          type="search"
          placeholder="Search tasks..."
          value={filters.q}
          onChange={(e) => onFilterChange({ q: e.target.value })}
        />

        {/* Clear button */}
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
            className="w-full"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
