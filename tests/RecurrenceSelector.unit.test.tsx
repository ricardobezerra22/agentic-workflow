import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecurrenceSelector } from '@/features/tasks/components/RecurrenceSelector'

describe('RecurrenceSelector', () => {
  it('renders a disabled select', () => {
    render(<RecurrenceSelector />)
    const select = screen.getByRole('combobox', { name: /recurrence/i })
    expect(select).toBeDisabled()
  })

  it('shows all four frequency options', () => {
    render(<RecurrenceSelector />)
    expect(screen.getByRole('option', { name: /does not repeat/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /daily/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /weekly/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /monthly/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /yearly/i })).toBeInTheDocument()
  })

  it('shows coming-soon hint text', () => {
    render(<RecurrenceSelector />)
    expect(screen.getByText(/recurring-tasks/i)).toBeInTheDocument()
  })
})
