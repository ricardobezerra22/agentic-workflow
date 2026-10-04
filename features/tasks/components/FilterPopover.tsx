'use client'

import { useRef, useEffect } from 'react'
import type { TaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import type { TaskStatus } from '@/features/tasks/types'

interface FilterPopoverProps {
  isOpen: boolean
  onClose: () => void
  filters: TaskFilters
  onFilterChange: (updates: Partial<TaskFilters>) => void
  onClearFilters: () => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'all',  label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Completed' },
]

export function FilterPopover({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearFilters,
}: Readonly<FilterPopoverProps>) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const hasActiveFilters = filters.priority !== '' || filters.q !== ''

  useEffect(() => {
    if (!isOpen) return
    const close = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) onClose()
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 z-50 w-52 bg-muted border border-border p-4 shadow-notion-md animate-in fade-in slide-in-from-top-2"
    >
      {/* Status */}
      <div className="mb-4">
        <p className="field-label">Status</p>
        <div className="flex flex-col gap-0.5">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ status: opt.value })}
              className={`text-left px-2 py-1.5 text-sm transition-colors ${
                filters.status === opt.value
                  ? 'text-primary font-semibold'
                  : 'text-foreground hover:text-primary'
              }`}
            >
              {filters.status === opt.value ? '→ ' : '  '}{opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="border-t border-border pt-3">
        <label htmlFor="filter-priority" className="field-label">Priority</label>
        <select
          id="filter-priority"
          value={filters.priority}
          onChange={(e) => onFilterChange({ priority: e.target.value })}
          className="custom-select w-full"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => { onClearFilters(); onClose() }}
          className="w-full text-left text-xs text-muted-foreground hover:text-foreground border-t border-border mt-3 pt-3 transition-colors"
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  )
}
