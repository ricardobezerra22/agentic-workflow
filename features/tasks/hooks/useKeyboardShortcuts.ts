'use client'

import { useEffect, useRef } from 'react'

interface ShortcutConfig {
  'cmd+k': () => void
  'cmd+z': () => void
  'ctrl+k': () => void
  'ctrl+z': () => void
  'escape': () => void
  'n': () => void
}

export function useKeyboardShortcuts(shortcuts: Partial<ShortcutConfig>) {
  const isTypingRef = useRef(false)

  useEffect(() => {
    // Track if user is typing in an input
    const handleFocus = () => {
      isTypingRef.current = true
    }
    const handleBlur = () => {
      isTypingRef.current = false
    }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Cmd/Ctrl + K = Search
      if (modKey && e.key === 'k') {
        e.preventDefault()
        shortcuts['cmd+k']?.()
      }

      // Cmd/Ctrl + Z = Undo
      if (modKey && e.key === 'z') {
        e.preventDefault()
        shortcuts['cmd+z']?.()
      }

      // Escape
      if (e.key === 'Escape') {
        shortcuts['escape']?.()
      }

      // N = New task (only if not typing)
      if (e.key === 'n' && !isTypingRef.current && !isInput) {
        e.preventDefault()
        shortcuts['n']?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}
