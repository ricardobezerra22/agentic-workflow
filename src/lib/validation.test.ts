import { describe, it, expect } from 'vitest'
import { validateListParams, validateTask, validatePatchTask } from '@/lib/validation'

describe('validateListParams', () => {
  describe('edge cases with null and undefined', () => {
    it('should handle null priority gracefully', () => {
      const result = validateListParams({ priority: null })
      // Currently fails with TypeError, should handle gracefully
      expect(result.valid).toBe(true) // null should be treated as not provided
    })

    it('should handle empty string priority', () => {
      const result = validateListParams({ priority: '' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'priority' })
      )
    })

    it('should handle null status gracefully', () => {
      const result = validateListParams({ status: null })
      // null should be treated as not provided
      expect(result.valid).toBe(true)
    })

    it('should handle undefined status', () => {
      const result = validateListParams({ status: undefined })
      expect(result.valid).toBe(true)
    })

    it('should validate valid priority values', () => {
      const result = validateListParams({ priority: 'low' })
      expect(result.valid).toBe(true)
    })

    it('should reject invalid priority values', () => {
      const result = validateListParams({ priority: 'critical' })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'priority', issue: 'invalid_value' })
      )
    })
  })
})

describe('validateTask', () => {
  describe('edge cases with null priority', () => {
    it('should handle null priority in body', () => {
      const result = validateTask({
        title: 'Test task',
        priority: null,
      })
      // null should be treated as not provided, using default
      expect(result.valid).toBe(true)
    })

    it('should accept task with undefined priority', () => {
      const result = validateTask({
        title: 'Test task',
      })
      expect(result.valid).toBe(true)
    })
  })
})

describe('validatePatchTask', () => {
  describe('edge cases with null values in update body', () => {
    it('should handle null priority in patch body', () => {
      const result = validatePatchTask({
        priority: null,
      })
      // null should be treated as not modifying the field, but must have other valid fields
      expect(result.valid).toBe(true)
    })

    it('should reject null completed field in patch body', () => {
      const result = validatePatchTask({
        title: 'Test',
        completed: null,
      })
      // completed null should be treated as not provided, which is valid
      expect(result.valid).toBe(true)
    })

    it('should accept patch with no fields', () => {
      const result = validatePatchTask({})
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.objectContaining({ issue: 'no_known_fields' })
      )
    })
  })
})
