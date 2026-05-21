import { CloseButton, Dialog, Table, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useShortcutRegistry } from './ShortcutRegistryContext'

type Props = {
  open: boolean
  onClose: () => void
}

const KeyboardShortcutHelp = ({ open, onClose }: Props) => {
  const { t } = useTranslation()
  const { shortcuts } = useShortcutRegistry()
  const entries = Object.entries(shortcuts)

  return (
    <Dialog.Root open={open} onOpenChange={({ open: o }) => !o && onClose()} placement='center'>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger asChild>
            <CloseButton />
          </Dialog.CloseTrigger>
          <Dialog.Header>
            <Dialog.Title>{t('shortcuts.help_title', { defaultValue: 'Keyboard shortcuts' })}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            {entries.length === 0 ? (
              <Text>{t('shortcuts.none', { defaultValue: 'No shortcuts available.' })}</Text>
            ) : (
              <Table.Root size='sm' variant='outline'>
                <Table.Body>
                  {entries.map(([id, { label, description }]) => (
                    <Table.Row key={id}>
                      <Table.Cell fontFamily='mono' whiteSpace='nowrap' fontWeight='semibold' width='1%'>
                        {label}
                      </Table.Cell>
                      <Table.Cell>{description}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}

export default KeyboardShortcutHelp
