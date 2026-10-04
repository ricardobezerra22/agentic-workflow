'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { validateTask, validatePatchTask } from '@/lib/validation'
import type { Task, CreateTaskInput, TaskPriority } from '@/features/tasks/types'

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput | (Partial<CreateTaskInput> & { completed?: boolean })) => Promise<void>
  onCancel: () => void
  editingTask?: Task | null
  loading?: boolean
}

export function TaskForm({ onSubmit, onCancel, editingTask, loading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<{
    title: string
    description: string
    priority: TaskPriority
    dueDate: string
  }>({
    title: editingTask?.title || '',
    description: editingTask?.description || '',
    priority: (editingTask?.priority as TaskPriority) || 'medium',
    dueDate: editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || '',
        priority: editingTask.priority as TaskPriority,
        dueDate: editingTask.dueDate ? editingTask.dueDate.split('T')[0] : '',
      })
    }
  }, [editingTask])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitError('')

    // Validate
    const validation = editingTask
      ? validatePatchTask(formData)
      : validateTask(formData)

    if (!validation.valid) {
      const errorMap: Record<string, string> = {}
      validation.errors?.forEach((err: any) => {
        errorMap[err.field] = err.message
      })
      setErrors(errorMap)
      return
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
      })
      // Reset on success
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save task')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      {submitError && <Alert type="error">{submitError}</Alert>}

      <Input
        type="text"
        label="Task title"
        placeholder="What needs to be done?"
        value={formData.title}
        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
        error={errors.title}
        required
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Add details..."
          rows={3}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-foreground">
            Priority
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
            }
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <Input
          type="date"
          label="Due date"
          value={formData.dueDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
          error={errors.dueDate}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : editingTask ? 'Update task' : 'Create task'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
