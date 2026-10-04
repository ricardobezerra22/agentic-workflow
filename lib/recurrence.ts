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
      next.setMonth(next.getMonth() + 1)
      // Handle month-end: if original day > days in new month, set to last day of month
      const daysInNewMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      if (originalDay > daysInNewMonth) {
        next.setDate(daysInNewMonth)
      } else {
        next.setDate(originalDay)
      }
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
