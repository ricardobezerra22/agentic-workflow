import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskDetailDrawer } from '@/features/tasks/components/TaskDetailDrawer'
import type { Task, UpdateTaskInput } from '@/features/tasks/types'

const baseTask: Task = {
  id: 1,
  title: 'Test task',
  description: null,
  priority: 'medium',
  dueDate: null,
  completed: false,
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('TaskDetailDrawer', () => {
  let onClose: () => void
  let onSave: (id: number, updates: UpdateTaskInput) => Promise<void>
  let onDelete: (id: number) => Promise<void>

  beforeEach(() => {
    onClose = vi.fn() as () => void
    onSave = vi.fn().mockResolvedValue(undefined) as (id: number, updates: UpdateTaskInput) => Promise<void>
    onDelete = vi.fn().mockResolvedValue(undefined) as (id: number) => Promise<void>
  })

  it('renders task title in the drawer', () => {
    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )
    expect(screen.getByDisplayValue('Test task')).toBeInTheDocument()
  })

  it('calls onClose immediately on Escape when form is clean', () => {
    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows discard confirmation when form is dirty and Escape pressed', () => {
    // Replace window.confirm to capture it
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )

    // Dirty the form by changing the title
    const titleInput = screen.getByDisplayValue('Test task')
    fireEvent.change(titleInput, { target: { value: 'Changed title' } })

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('calls onClose when user confirms discard', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )

    const titleInput = screen.getByDisplayValue('Test task')
    fireEvent.change(titleInput, { target: { value: 'Changed title' } })

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)

    confirmSpy.mockRestore()
  })

  it('shows inline error when Save clicked with empty title', async () => {
    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )

    const titleInput = screen.getByDisplayValue('Test task')
    fireEvent.change(titleInput, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('has role=dialog and aria-labelledby', () => {
    render(
      <TaskDetailDrawer
        task={baseTask}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
      />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-labelledby')
  })
})
