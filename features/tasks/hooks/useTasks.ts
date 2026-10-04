'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@/features/tasks/types'
import type { TaskFilters } from './useTaskFilters'

interface UseTasksResult {
  tasks: Task[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTasks(filters: TaskFilters): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.q) params.append('q', filters.q)

      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.statusText}`)
      }

      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return { tasks, loading, error, refetch: fetchTasks }
}
