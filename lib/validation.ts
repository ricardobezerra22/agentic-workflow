export type Priority = 'low' | 'medium' | 'high'
export type Status = 'all' | 'open' | 'done'

interface ValidationError {
  field: string
  issue: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']
const VALID_STATUSES: Status[] = ['all', 'open', 'done']

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const d = new Date(str + 'T00:00:00Z')
  return d.toISOString().startsWith(str)
}

export function validateTask(body: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const bodyObj = body as Record<string, unknown>

  const title = typeof bodyObj.title === 'string' ? bodyObj.title.trim() : null
  if (!title) {
    errors.push({ field: 'title', issue: 'required' })
  } else if (title.length > 200) {
    errors.push({ field: 'title', issue: 'max_length_exceeded' })
  }

  if (bodyObj.priority !== undefined && !VALID_PRIORITIES.includes(bodyObj.priority as Priority)) {
    errors.push({ field: 'priority', issue: 'invalid_value' })
  }

  if (bodyObj.dueDate !== undefined && bodyObj.dueDate !== null) {
    if (typeof bodyObj.dueDate !== 'string' || !isValidDate(bodyObj.dueDate)) {
      errors.push({ field: 'dueDate', issue: 'invalid_date' })
    }
  }

  if (bodyObj.description !== undefined && bodyObj.description !== null) {
    if (typeof bodyObj.description !== 'string' || bodyObj.description.length > 2000) {
      errors.push({ field: 'description', issue: 'max_length_exceeded' })
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validatePatchTask(body: unknown): ValidationResult {
  const bodyObj = body as Record<string, unknown>
  const KNOWN = ['title', 'description', 'priority', 'dueDate', 'completed']
  const hasKnown = KNOWN.some(k => k in bodyObj)
  if (!hasKnown) {
    return {
      valid: false,
      errors: [{ field: 'body', issue: 'no_known_fields' }],
    }
  }
  return validateTask({ title: bodyObj.title ?? 'placeholder', ...bodyObj })
}

export function validateListParams(query: unknown): ValidationResult {
  const errors: ValidationError[] = []
  const queryObj = query as Record<string, unknown>

  if (queryObj.status !== undefined && !VALID_STATUSES.includes(queryObj.status as Status)) {
    errors.push({ field: 'status', issue: 'invalid_value' })
  }

  if (
    queryObj.priority !== undefined &&
    !VALID_PRIORITIES.includes(queryObj.priority as Priority)
  ) {
    errors.push({ field: 'priority', issue: 'invalid_value' })
  }

  return { valid: errors.length === 0, errors }
}
