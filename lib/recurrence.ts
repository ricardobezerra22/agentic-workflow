import type { RecurrencePattern } from '@prisma/client'

export function calculateNextDueDate(
  currentDate: Date,
  pattern: RecurrencePattern
): Date {
  const next = new Date(currentDate)

  switch (pattern) {
    case 'NONE':
      return next
    case 'DAILY':
      next.setDate(next.getDate() + 1)
      return next
    case 'WEEKLY':
      next.setDate(next.getDate() + 7)
      return next
    case 'MONTHLY': {
      const originalDay = currentDate.getDate()
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth()
      const nextYear = m === 11 ? y + 1 : y
      const nextMonth = (m + 1) % 12
      // Last day of next month (day 0 of month+2 = last day of month+1)
      const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate()
      // setFullYear avoids JS auto-overflow that occurs when setMonth is called on day 31
      next.setFullYear(nextYear, nextMonth, Math.min(originalDay, lastDay))
      return next
    }
    default:
      return next
  }
}

export function isRecurrenceEndDatePassed(
  endDate: Date | null | undefined,
  today: Date = new Date()
): boolean {
  if (!endDate) return false
  // Compare dates ignoring time; end date is inclusive
  const endDateOnly = new Date(endDate)
  endDateOnly.setHours(0, 0, 0, 0)
  const todayOnly = new Date(today)
  todayOnly.setHours(0, 0, 0, 0)
  return endDateOnly < todayOnly
}

export function getRecurrenceDisplayLabel(pattern: RecurrencePattern): string {
  switch (pattern) {
    case 'DAILY':
      return 'Repeats Daily'
    case 'WEEKLY':
      return 'Repeats Weekly'
    case 'MONTHLY':
      return 'Repeats Monthly'
    case 'NONE':
      return ''
    default:
      return ''
  }
}
