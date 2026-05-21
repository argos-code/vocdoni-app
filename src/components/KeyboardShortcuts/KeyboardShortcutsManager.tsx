import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { generatePath, useLocation, useNavigate } from 'react-router-dom'
import { Routes } from '~routes'
import KeyboardShortcutHelp from './KeyboardShortcutHelp'
import { ShortcutRegistryProvider, useShortcutRegistry } from './ShortcutRegistryContext'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

const modKey = isMac ? '⌘' : 'Ctrl'

/** Extracts process ID from dashboard process URLs (/admin/process/:id/...) */
const extractProcessId = (pathname: string): string | null => {
  const match = pathname.match(/^\/admin\/process\/([^/]+)/)
  return match ? match[1] : null
}

const ShortcutsInner = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { register, unregister } = useShortcutRegistry()
  const [showHelp, setShowHelp] = useState(false)

  const handleNewProcess = useCallback(() => {
    navigate(generatePath(Routes.processes.create))
  }, [navigate])

  const handleViewResults = useCallback(() => {
    const processId = extractProcessId(location.pathname)
    if (!processId) return
    navigate(generatePath(Routes.dashboard.processResults, { id: processId }))
  }, [navigate, location.pathname])

  const handleShowHelp = useCallback(() => setShowHelp((prev) => !prev), [])

  useKeyboardShortcuts([
    {
      key: 'n',
      ctrl: true,
      preventDefault: true,
      onTrigger: handleNewProcess,
    },
    {
      key: 'R',
      ctrl: true,
      preventDefault: true,
      onTrigger: handleViewResults,
    },
    {
      key: '?',
      onTrigger: handleShowHelp,
    },
    {
      key: 'Escape',
      allowInInputs: true,
      onTrigger: () => setShowHelp(false),
    },
  ])

  useEffect(() => {
    register('new-process', {
      label: `${modKey}+N`,
      description: t('shortcuts.new_process', { defaultValue: 'Create new process' }),
    })
    register('view-results', {
      label: `${modKey}+Shift+R`,
      description: t('shortcuts.view_results', { defaultValue: 'View results for current process' }),
    })
    register('escape', {
      label: 'Escape',
      description: t('shortcuts.close_modal', { defaultValue: 'Close modal / dialog' }),
    })
    register('help', {
      label: '?',
      description: t('shortcuts.show_help', { defaultValue: 'Show keyboard shortcuts' }),
    })

    return () => {
      unregister('new-process')
      unregister('view-results')
      unregister('escape')
      unregister('help')
    }
  }, [register, unregister, t])

  return <KeyboardShortcutHelp open={showHelp} onClose={() => setShowHelp(false)} />
}

export const KeyboardShortcutsManager = () => (
  <ShortcutRegistryProvider>
    <ShortcutsInner />
  </ShortcutRegistryProvider>
)
