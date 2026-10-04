'use client'

import { useState, useCallback, useId } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { RecurrenceSelector } from './RecurrenceSelector'
import type { Task, TaskPriority, UpdateTaskInput } from '@/features/tasks/types'

interface TaskDetailDrawerProps {
  task: Task
  onClose: () => void
  onSave: (id: number, updates: UpdateTaskInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function TaskDetailDrawer({ task, onClose, onSave, onDelete }: TaskDetailDrawerProps) {
  const titleId = useId()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : ''
  )
  const [titleError, setTitleError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')

  const requestClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm('Discard unsaved changes?')) return
    }
    onClose()
  }, [isDirty, onClose])


  const handleSave = async () => {
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }
    setTitleError('')
    setSaveError('')

    const updates: UpdateTaskInput = {}
    if (title !== task.title) updates.title = title.trim()
    if (description !== (task.description ?? '')) updates.description = description || undefined
    if (priority !== task.priority) updates.priority = priority
    const newDue = dueDate || null
    const oldDue = task.dueDate ? task.dueDate.split('T')[0] : null
    if (newDue !== oldDue) updates.dueDate = newDue ?? undefined

    setSaving(true)
    try {
      await onSave(task.id, updates)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await onDelete(task.id)
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) requestClose() }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <DialogPrimitive.Content
          role="dialog"
          aria-labelledby={titleId}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
          className={[
            'fixed z-50 bg-background border-l border-border shadow-xl flex flex-col',
            // desktop: right panel
            'md:inset-y-0 md:right-0 md:w-80 md:slide-in-from-right',
            // mobile: bottom sheet
            'inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-xl md:rounded-none',
            'slide-in-from-bottom-2 md:slide-in-from-bottom-0',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h2 id={titleId} className="text-base font-semibold text-foreground truncate">
              Task Detail
            </h2>
            <button
              onClick={requestClose}
              aria-label="Close drawer"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 px-5 pb-5 space-y-4 overflow-y-auto">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label htmlFor="drawer-title" className="text-sm font-medium text-foreground">
                Title
              </label>
              <input
                id="drawer-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setTitleError('') }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-describedby={titleError ? 'drawer-title-error' : undefined}
              />
              {titleError && (
                <p id="drawer-title-error" className="text-xs text-destructive" role="alert">
                  {titleError}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label htmlFor="drawer-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="drawer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description…"
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Priority + Due date row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="drawer-priority" className="text-sm font-medium text-foreground">
                  Priority
                </label>
                <select
                  id="drawer-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="drawer-due-date" className="text-sm font-medium text-foreground">
                  Due Date
                </label>
                <input
                  id="drawer-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Recurrence (scaffolded) */}
            <RecurrenceSelector />

            {saveError && (
              <p className="text-xs text-destructive" role="alert">{saveError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-sm text-destructive hover:text-destructive/80 disabled:opacity-50 transition-colors"
              aria-label="Delete task"
            >
              {deleting ? 'Deleting…' : 'Delete task'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
