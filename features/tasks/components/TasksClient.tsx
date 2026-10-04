'use client'

import { useState } from 'react'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import { TaskFilters } from './TaskFilters'
import { TaskEmptyState } from './TaskEmptyState'
import { Alert } from '@/components/ui/alert'
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useTaskMutation } from '@/features/tasks/hooks/useTaskMutation'
import type { Task, CreateTaskInput } from '@/features/tasks/types'

export function TasksClient() {
  const { filters, updateFilters, clearFilters } = useTaskFilters()
  const { tasks, loading, error, refetch } = useTasks(filters)
  const { createTask, updateTask, deleteTask, loading: mutationLoading, error: mutationError } = useTaskMutation()

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: CreateTaskInput | (Partial<CreateTaskInput> & { completed?: boolean })) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
        setSuccessMessage('Task updated successfully')
      } else {
        await createTask(data as CreateTaskInput)
        setSuccessMessage('Task created successfully')
      }

      setShowForm(false)
      setEditingTask(null)
      await refetch()

      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      // Error is handled by mutation hook
    }
  }

  const handleToggleComplete = async (taskId: number, completed: boolean) => {
    try {
      await updateTask(taskId, { completed })
      await refetch()
    } catch (err) {
      // Error is handled by mutation hook
    }
  }

  const handleDelete = async (taskId: number, taskTitle: string) => {
    try {
      await deleteTask(taskId)
      setSuccessMessage(`"${taskTitle}" deleted`)
      await refetch()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      // Error is handled by mutation hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <Alert type="success">{successMessage}</Alert>
      )}

      {/* Mutation error */}
      {mutationError && (
        <Alert type="error">{mutationError}</Alert>
      )}

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFilterChange={updateFilters}
        onClearFilters={clearFilters}
      />

      {/* Form (create/edit) */}
      {showForm && (
        <TaskForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingTask(null)
          }}
          editingTask={editingTask}
          loading={mutationLoading}
        />
      )}

      {/* Task list or empty state */}
      {!showForm && tasks.length === 0 && !loading ? (
        <TaskEmptyState onCreateClick={() => setShowForm(true)} />
      ) : (
        <TaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onEdit={handleEditTask}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDelete}
        />
      )}

      {/* Create button (when list is visible) */}
      {!showForm && tasks.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-primary hover:underline"
          >
            + Add another task
          </button>
        </div>
      )}
    </div>
  )
}
