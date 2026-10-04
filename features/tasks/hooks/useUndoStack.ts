'use client'

import { useState, useCallback } from 'react'
import type { Task } from '@/features/tasks/types'

export interface UndoAction {
  type: 'delete' | 'update'
  task: Task
  timestamp: number
}

export interface UseUndoStackResult {
  undoAction: UndoAction | null
  canUndo: boolean
  recordAction: (action: UndoAction) => void
  clearUndo: () => void
}

export function useUndoStack(): UseUndoStackResult {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])

  const recordAction = useCallback((action: UndoAction) => {
    setUndoStack((prev) => [action, ...prev.slice(0, 4)])
  }, [])

  const clearUndo = useCallback(() => {
    setUndoStack([])
  }, [])

  return {
    undoAction: undoStack[0] || null,
    canUndo: undoStack.length > 0,
    recordAction,
    clearUndo,
  }
}
