import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChakraProvider } from '@chakra-ui/react'
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import KeyboardShortcutHelp from './KeyboardShortcutHelp'
import { ShortcutRegistryProvider, useShortcutRegistry } from './ShortcutRegistryContext'
import { system } from '~theme/system'
import { useEffect } from 'react'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  resources: { en: { common: {} } },
  showSupportNotice: false,
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider value={system}>
    <I18nextProvider i18n={i18n}>
      <ShortcutRegistryProvider>{children}</ShortcutRegistryProvider>
    </I18nextProvider>
  </ChakraProvider>
)

const RegisterShortcuts = ({ entries }: { entries: Array<{ id: string; label: string; description: string }> }) => {
  const { register, unregister } = useShortcutRegistry()
  useEffect(() => {
    entries.forEach(({ id, label, description }) => register(id, { label, description }))
    return () => entries.forEach(({ id }) => unregister(id))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

describe('KeyboardShortcutHelp', () => {
  it('renders the dialog title when open', () => {
    render(
      <>
        <KeyboardShortcutHelp open={true} onClose={vi.fn()} />
      </>,
      { wrapper }
    )

    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', () => {
    render(<KeyboardShortcutHelp open={false} onClose={vi.fn()} />, { wrapper })

    expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument()
  })

  it('shows a "no shortcuts" message when the registry is empty', () => {
    render(<KeyboardShortcutHelp open={true} onClose={vi.fn()} />, { wrapper })

    expect(screen.getByText('No shortcuts available.')).toBeInTheDocument()
  })

  it('renders registered shortcuts with labels and descriptions', () => {
    render(
      <>
        <RegisterShortcuts
          entries={[
            { id: 'new-process', label: 'Ctrl+N', description: 'Create new process' },
            { id: 'help', label: '?', description: 'Show keyboard shortcuts' },
          ]}
        />
        <KeyboardShortcutHelp open={true} onClose={vi.fn()} />
      </>,
      { wrapper }
    )

    expect(screen.getByText('Ctrl+N')).toBeInTheDocument()
    expect(screen.getByText('Create new process')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.getByText('Show keyboard shortcuts')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutHelp open={true} onClose={onClose} />, { wrapper })

    await userEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
