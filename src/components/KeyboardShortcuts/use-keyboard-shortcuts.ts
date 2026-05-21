import { useEffect, useRef } from 'react'

export type ShortcutDef = {
  /** event.key value, case-sensitive (e.g. 'n', 'R', 'Escape', '?') */
  key: string
  /** Require Ctrl (Win/Linux) or Cmd (Mac) to be held */
  ctrl?: boolean
  /** Allow this shortcut to fire even when focus is inside a form input */
  allowInInputs?: boolean
  /** Call event.preventDefault() when this shortcut fires */
  preventDefault?: boolean
  onTrigger: () => void
}

const isFormElement = (el: Element | null): boolean => {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  const ce = el.getAttribute('contenteditable')
  if (ce === 'true' || ce === '' || (el as HTMLElement).isContentEditable) return true
  return false
}

const matchesShortcut = (event: KeyboardEvent, def: ShortcutDef): boolean => {
  if (event.key !== def.key) return false
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey
  if (Boolean(def.ctrl) !== hasCtrlOrMeta) return false
  return true
}

export const useKeyboardShortcuts = (shortcuts: ShortcutDef[]) => {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement
      for (const def of shortcutsRef.current) {
        if (!def.allowInInputs && isFormElement(active)) continue
        if (!matchesShortcut(event, def)) continue
        if (def.preventDefault) event.preventDefault()
        def.onTrigger()
        break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
