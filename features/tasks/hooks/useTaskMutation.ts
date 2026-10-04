'use client'

import { useState } from 'react'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/features/tasks/types'

interface UseTaskMutationResult {
  createTask: (data: CreateTaskInput) => Promise<Task>
  updateTask: (id: number, data: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: number) => Promise<void>
  loading: boolean
  error: string | null
}

export function useTaskMutation(): UseTaskMutationResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTask = async (data: CreateTaskInput): Promise<Task> => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || `Failed to create task: ${res.statusText}`)
      }

      return await res.json()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (id: number, data: UpdateTaskInput): Promise<Task> => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error?.message || `Failed to update task: ${res.statusText}`)
      }

      return await res.json()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteTask = async (id: number): Promise<void> => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        throw new Error(`Failed to delete task: ${res.statusText}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { createTask, updateTask, deleteTask, loading, error }
}
