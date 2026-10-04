'use client'

import { useState } from 'react'
import type { TaskStatus } from '@/features/tasks/types'

export interface TaskFilters {
  status: TaskStatus
  priority: string
  q: string
}

export function useTaskFilters(initial: Partial<TaskFilters> = {}) {
  const [filters, setFilters] = useState<TaskFilters>({
    status: (initial.status as TaskStatus) || 'all',
    priority: initial.priority || '',
    q: initial.q || '',
  })

  const updateFilters = (updates: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const clearFilters = () => {
    setFilters({ status: 'all', priority: '', q: '' })
  }

  return { filters, updateFilters, clearFilters }
}
