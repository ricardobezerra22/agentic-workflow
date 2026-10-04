'use client'

import { useState } from 'react'
import { TaskHeader } from './TaskHeader'
import { InlineTaskCreator } from './InlineTaskCreator'
import { TaskListMinimal } from './TaskListMinimal'
import { FilterPopover } from './FilterPopover'
import { Toast } from '@/components/ui/toast'
import { useTaskFilters } from '@/features/tasks/hooks/useTaskFilters'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { useTaskMutation } from '@/features/tasks/hooks/useTaskMutation'
import { useUndoStack } from '@/features/tasks/hooks/useUndoStack'
import { useKeyboardShortcuts } from '@/features/tasks/hooks/useKeyboardShortcuts'
import type { Task, CreateTaskInput } from '@/features/tasks/types'

export function TasksClientRedesigned() {
  const { filters, updateFilters, clearFilters } = useTaskFilters()
  const { tasks, loading, error, refetch } = useTasks(filters)
  const { createTask, updateTask, deleteTask } = useTaskMutation()

  const [showCreator, setShowCreator] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{
    message: string
    type: 'default' | 'success' | 'error'
    action?: { label: string; onClick: () => void | Promise<void> }
  } | null>(null)

  const { undoAction, recordAction, clearUndo } = useUndoStack()

  // Handle search filter
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    updateFilters({ q: value })
  }

  // Create task
  const handleCreateTask = async (data: CreateTaskInput) => {
    setCreatingLoading(true)
    try {
      await createTask(data)
      setShowCreator(false)
      setSearchValue('')
      updateFilters({ q: '' })
      clearUndo()
      await refetch()
      setToast({ message: 'Task created', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to create task',
        type: 'error',
      })
    } finally {
      setCreatingLoading(false)
    }
  }

  // Update task (rename or toggle)
  const handleUpdateTask = async (taskId: number, updates: any) => {
    try {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      // Record update action for undo if it's a delete
      if (updates.completed !== undefined && updates.completed === false) {
        // Task was uncompleted, could be relevant for future undo
      }

      await updateTask(taskId, updates)
      await refetch()

      if (updates.title) {
        setToast({ message: 'Task renamed', type: 'success' })
        setTimeout(() => setToast(null), 2000)
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update task',
        type: 'error',
      })
    }
  }

  // Delete task with undo
  const handleDeleteTask = async (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    setDeletingId(taskId)

    try {
      // Record for undo
      recordAction({
        type: 'delete',
        task,
        timestamp: Date.now(),
      })

      await deleteTask(taskId)
      await refetch()

      // Show toast with undo option
      setToast({
        message: `"${task.title}" deleted`,
        type: 'default',
        action: {
          label: 'Undo',
          onClick: () => handleUndoDelete(task),
        },
      })

      // Clear undo option after 5 seconds
      setTimeout(() => {
        if (toast?.action?.label === 'Undo') {
          setToast(null)
        }
      }, 5000)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete task',
        type: 'error',
      })
    } finally {
      setDeletingId(null)
    }
  }

  // Undo delete
  const handleUndoDelete = async (task: Task) => {
    try {
      setToast(null)
      await createTask({
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        dueDate: task.dueDate as string | undefined,
      })
      await refetch()
      setToast({ message: 'Task restored', type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to restore task',
        type: 'error',
      })
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'cmd+k': () => {
      document.querySelector<HTMLInputElement>('[aria-label="Search tasks"]')?.focus()
    },
    'ctrl+k': () => {
      document.querySelector<HTMLInputElement>('[aria-label="Search tasks"]')?.focus()
    },
    'cmd+z': () => {
      if (undoAction?.type === 'delete') {
        handleUndoDelete(undoAction.task)
      }
    },
    'ctrl+z': () => {
      if (undoAction?.type === 'delete') {
        handleUndoDelete(undoAction.task)
      }
    },
    'escape': () => {
      setShowCreator(false)
      setShowFilters(false)
    },
    'n': () => {
      if (!showCreator) {
        setShowCreator(true)
      }
    },
  })

  const hasActiveFilters = filters.priority !== '' || filters.status !== 'all'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <TaskHeader
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onNewTask={() => setShowCreator(true)}
        onFilterToggle={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main content */}
      <div className="mx-auto max-w-6xl">
        {/* Filter popover */}
        <div className="relative px-6 sm:px-8">
          <FilterPopover
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            filters={filters}
            onFilterChange={updateFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Inline creator */}
        {showCreator && (
          <div className="px-6 sm:px-8 py-4">
            <InlineTaskCreator
              onSubmit={handleCreateTask}
              onCancel={() => setShowCreator(false)}
              loading={creatingLoading}
            />
          </div>
        )}

        {/* Task list */}
        <div className="divide-y divide-border/20">
          {error && (
            <div className="px-6 sm:px-8 py-4 text-sm text-destructive bg-destructive/8 border-b border-destructive/20 rounded-lg mx-6 sm:mx-8 my-4">
              {error}
            </div>
          )}

          <TaskListMinimal
            tasks={tasks}
            loading={loading}
            onToggleComplete={(id, completed) => handleUpdateTask(id, { completed })}
            onRename={(id, newTitle) => handleUpdateTask(id, { title: newTitle })}
            onDelete={handleDeleteTask}
            deletingId={deletingId}
          />
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-8 sm:right-auto max-w-sm z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            action={toast.action}
            onDismiss={() => setToast(null)}
            duration={toast.action ? 0 : 4000}
          />
        </div>
      )}
    </div>
  )
}
