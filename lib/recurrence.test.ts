import { describe, it, expect } from 'vitest'
import {
  calculateNextDueDate,
  isRecurrenceEndDatePassed,
  getRecurrenceDisplayLabel,
} from './recurrence'

describe('recurrence utilities', () => {
  describe('calculateNextDueDate', () => {
    it('calculates DAILY pattern correctly', () => {
      const current = new Date('2026-10-04')
      const next = calculateNextDueDate(current, 'DAILY')
      expect(next.toISOString().split('T')[0]).toBe('2026-10-05')
    })

    it('calculates WEEKLY pattern correctly (7 days later)', () => {
      const current = new Date('2026-10-04') // Saturday
      const next = calculateNextDueDate(current, 'WEEKLY')
      expect(next.toISOString().split('T')[0]).toBe('2026-10-11')
    })

    it('calculates MONTHLY pattern correctly (same day next month)', () => {
      const current = new Date('2026-10-15')
      const next = calculateNextDueDate(current, 'MONTHLY')
      expect(next.toISOString().split('T')[0]).toBe('2026-11-15')
    })

    it('handles month-end edge case: Jan 31 → Feb 28 (non-leap year)', () => {
      const current = new Date('2027-01-31')
      const next = calculateNextDueDate(current, 'MONTHLY')
      expect(next.toISOString().split('T')[0]).toBe('2027-02-28')
    })

    it('handles month-end edge case: Jan 31 → Feb 29 (leap year)', () => {
      const current = new Date('2024-01-31')
      const next = calculateNextDueDate(current, 'MONTHLY')
      expect(next.toISOString().split('T')[0]).toBe('2024-02-29')
    })

    it('handles year boundary: Dec 31 → Jan 31 (monthly)', () => {
      const current = new Date('2026-12-31')
      const next = calculateNextDueDate(current, 'MONTHLY')
      expect(next.toISOString().split('T')[0]).toBe('2027-01-31')
    })

    it('handles NONE pattern by returning same date', () => {
      const current = new Date('2026-10-04')
      const next = calculateNextDueDate(current, 'NONE')
      expect(next.toISOString().split('T')[0]).toBe('2026-10-04')
    })

    it('returns Date object for all patterns', () => {
      const current = new Date('2026-10-04')
      const daily = calculateNextDueDate(current, 'DAILY')
      expect(daily).toBeInstanceOf(Date)
      const weekly = calculateNextDueDate(current, 'WEEKLY')
      expect(weekly).toBeInstanceOf(Date)
      const monthly = calculateNextDueDate(current, 'MONTHLY')
      expect(monthly).toBeInstanceOf(Date)
    })
  })

  describe('isRecurrenceEndDatePassed', () => {
    it('returns false when end date is in future', () => {
      const today = new Date('2026-10-04')
      const endDate = new Date('2026-10-31')
      const result = isRecurrenceEndDatePassed(endDate, today)
      expect(result).toBe(false)
    })

    it('returns false when end date is today (inclusive)', () => {
      const today = new Date('2026-10-04')
      const endDate = new Date('2026-10-04')
      const result = isRecurrenceEndDatePassed(endDate, today)
      expect(result).toBe(false)
    })

    it('returns true when end date is in past', () => {
      const today = new Date('2026-10-04')
      const endDate = new Date('2026-10-03')
      const result = isRecurrenceEndDatePassed(endDate, today)
      expect(result).toBe(true)
    })

    it('returns false when end date is null', () => {
      const today = new Date('2026-10-04')
      const result = isRecurrenceEndDatePassed(null, today)
      expect(result).toBe(false)
    })

    it('returns false when end date is undefined', () => {
      const today = new Date('2026-10-04')
      const result = isRecurrenceEndDatePassed(undefined, today)
      expect(result).toBe(false)
    })
  })

  describe('getRecurrenceDisplayLabel', () => {
    it('returns empty string for NONE pattern', () => {
      const label = getRecurrenceDisplayLabel('NONE')
      expect(label).toBe('')
    })

    it('returns "Repeats Daily" for DAILY pattern', () => {
      const label = getRecurrenceDisplayLabel('DAILY')
      expect(label).toBe('Repeats Daily')
    })

    it('returns "Repeats Weekly" for WEEKLY pattern', () => {
      const label = getRecurrenceDisplayLabel('WEEKLY')
      expect(label).toBe('Repeats Weekly')
    })

    it('returns "Repeats Monthly" for MONTHLY pattern', () => {
      const label = getRecurrenceDisplayLabel('MONTHLY')
      expect(label).toBe('Repeats Monthly')
    })
  })
})
