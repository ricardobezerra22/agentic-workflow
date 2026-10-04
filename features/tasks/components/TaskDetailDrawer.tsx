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

  const [title, setTitle]             = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority]       = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate]         = useState(task.dueDate ? task.dueDate.split('T')[0] : '')
  const [titleError, setTitleError]   = useState('')
  const [saveError, setSaveError]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')

  const requestClose = useCallback(() => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    onClose()
  }, [isDirty, onClose])

  const handleSave = async () => {
    if (!title.trim()) { setTitleError('Title is required'); return }
    setTitleError('')
    setSaveError('')

    const updates: UpdateTaskInput = {}
    if (title !== task.title)                     updates.title       = title.trim()
    if (description !== (task.description ?? '')) updates.description = description || undefined
    if (priority !== task.priority)               updates.priority    = priority
    const newDue = dueDate || null
    const oldDue = task.dueDate ? task.dueDate.split('T')[0] : null
    if (newDue !== oldDue) updates.dueDate = newDue ?? undefined

    setSaving(true)
    try   { await onSave(task.id, updates); onClose() }
    catch  (err) { setSaveError(err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try   { await onDelete(task.id); onClose() }
    catch  (err) { setSaveError(err instanceof Error ? err.message : 'Failed to delete') }
    finally { setDeleting(false) }
  }

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) requestClose() }}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50" />

        {/* Panel */}
        <DialogPrimitive.Content
          role="dialog"
          aria-labelledby={titleId}
          onEscapeKeyDown={(e) => { e.preventDefault(); requestClose() }}
          className={[
            'fixed z-50 flex flex-col',
            'bg-[var(--c-surface)] border-l border-[var(--c-border)]',
            'shadow-[4px_0_40px_rgb(0_0_0/0.6)]',
            // desktop: right panel
            'md:inset-y-0 md:right-0 md:w-80 md:slide-in-from-right',
            // mobile: bottom sheet
            'inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-none md:rounded-none',
            'slide-in-from-bottom-2 md:slide-in-from-bottom-0',
          ].join(' ')}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-[var(--c-border)]">
            <h2
              id={titleId}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Task Detail
            </h2>
            <button
              onClick={requestClose}
              aria-label="Close drawer"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form body */}
          <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">

            {/* Title */}
            <div>
              <label htmlFor="drawer-title" className="field-label">Title</label>
              <input
                id="drawer-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setTitleError('') }}
                className="field-input"
                aria-describedby={titleError ? 'drawer-title-error' : undefined}
              />
              {titleError && (
                <p id="drawer-title-error" className="mt-1 text-xs text-destructive" role="alert">
                  {titleError}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="drawer-description" className="field-label">Description</label>
              <textarea
                id="drawer-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description…"
                rows={3}
                className="field-input resize-none"
              />
            </div>

            {/* Priority + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="drawer-priority" className="field-label">Priority</label>
                <select
                  id="drawer-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="custom-select w-full"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="drawer-due-date" className="field-label">Due Date</label>
                <input
                  id="drawer-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            {/* Recurrence */}
            <RecurrenceSelector />

            {saveError && (
              <p className="text-xs text-destructive" role="alert">{saveError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--c-border)] shrink-0">
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="btn-danger"
              aria-label="Delete task"
            >
              {deleting ? 'Deleting…' : 'Delete task'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
