import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'

export type ShortcutEntry = {
  /** Display label for the key combo (e.g. 'Ctrl+N') */
  label: string
  description: string
}

type ShortcutRegistry = Record<string, ShortcutEntry>

type ShortcutRegistryContextValue = {
  shortcuts: ShortcutRegistry
  register: (id: string, entry: ShortcutEntry) => void
  unregister: (id: string) => void
}

const ShortcutRegistryContext = createContext<ShortcutRegistryContextValue | undefined>(undefined)

export const ShortcutRegistryProvider = ({ children }: { children: ReactNode }) => {
  const [shortcuts, setShortcuts] = useState<ShortcutRegistry>({})
  const shortcutsRef = useRef<ShortcutRegistry>({})

  const register = useCallback((id: string, entry: ShortcutEntry) => {
    shortcutsRef.current = { ...shortcutsRef.current, [id]: entry }
    setShortcuts({ ...shortcutsRef.current })
  }, [])

  const unregister = useCallback((id: string) => {
    const next = { ...shortcutsRef.current }
    delete next[id]
    shortcutsRef.current = next
    setShortcuts({ ...next })
  }, [])

  const value = useMemo(() => ({ shortcuts, register, unregister }), [shortcuts, register, unregister])

  return <ShortcutRegistryContext.Provider value={value}>{children}</ShortcutRegistryContext.Provider>
}

export const useShortcutRegistry = () => {
  const ctx = useContext(ShortcutRegistryContext)
  if (!ctx) throw new Error('useShortcutRegistry must be used within ShortcutRegistryProvider')
  return ctx
}
