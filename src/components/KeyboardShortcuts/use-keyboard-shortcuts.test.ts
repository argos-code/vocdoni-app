import { renderHook } from '@testing-library/react'
import { ShortcutDef, useKeyboardShortcuts } from './use-keyboard-shortcuts'

const fireKeydown = (init: KeyboardEventInit) => {
  window.dispatchEvent(new KeyboardEvent('keydown', init))
}

const makeShortcut = (overrides: Partial<ShortcutDef> & Pick<ShortcutDef, 'key' | 'onTrigger'>): ShortcutDef => ({
  ...overrides,
})

describe('useKeyboardShortcuts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // Reset activeElement to body
    document.body.focus()
  })

  it('calls the handler when the matching key is pressed', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', onTrigger })]))

    fireKeydown({ key: 'n' })

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('does not call handler for a different key', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', onTrigger })]))

    fireKeydown({ key: 'm' })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('calls handler when ctrl+key matches (ctrlKey)', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', ctrl: true, onTrigger })]))

    fireKeydown({ key: 'n', ctrlKey: true })

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('calls handler when ctrl+key matches (metaKey — Mac Cmd)', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', ctrl: true, onTrigger })]))

    fireKeydown({ key: 'n', metaKey: true })

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('does not call ctrl handler without modifier', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', ctrl: true, onTrigger })]))

    fireKeydown({ key: 'n' })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('does not call plain-key handler when ctrl is held', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', onTrigger })]))

    fireKeydown({ key: 'n', ctrlKey: true })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('handles Ctrl+Shift+R (event.key is uppercase R when shift is held)', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'R', ctrl: true, onTrigger })]))

    fireKeydown({ key: 'R', ctrlKey: true })

    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('calls preventDefault when configured', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', ctrl: true, preventDefault: true, onTrigger })]))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1)
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('does not call preventDefault when not configured', () => {
    const onTrigger = vi.fn()
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', ctrl: true, onTrigger })]))

    const event = new KeyboardEvent('keydown', { key: 'n', ctrlKey: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  describe('input-focus suppression', () => {
    const focusElement = (el: HTMLElement) => {
      document.body.appendChild(el)
      el.focus()
      return () => document.body.removeChild(el)
    }

    it('suppresses shortcut when an INPUT is focused', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '?', onTrigger })]))

      const input = document.createElement('input')
      const cleanup = focusElement(input)

      fireKeydown({ key: '?' })
      expect(onTrigger).not.toHaveBeenCalled()
      cleanup()
    })

    it('suppresses shortcut when a TEXTAREA is focused', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '?', onTrigger })]))

      const textarea = document.createElement('textarea')
      const cleanup = focusElement(textarea)

      fireKeydown({ key: '?' })
      expect(onTrigger).not.toHaveBeenCalled()
      cleanup()
    })

    it('suppresses shortcut when a SELECT is focused', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '?', onTrigger })]))

      const select = document.createElement('select')
      const cleanup = focusElement(select)

      fireKeydown({ key: '?' })
      expect(onTrigger).not.toHaveBeenCalled()
      cleanup()
    })

    it('suppresses shortcut when a contenteditable element is focused', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '?', onTrigger })]))

      const div = document.createElement('div')
      div.setAttribute('contenteditable', 'true')
      document.body.appendChild(div)

      // jsdom doesn't reliably focus contenteditable divs; mock activeElement directly
      const spy = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(div)

      fireKeydown({ key: '?' })
      expect(onTrigger).not.toHaveBeenCalled()

      spy.mockRestore()
      document.body.removeChild(div)
    })

    it('does NOT suppress Escape even when an INPUT is focused (allowInInputs)', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'Escape', allowInInputs: true, onTrigger })]))

      const input = document.createElement('input')
      const cleanup = focusElement(input)

      fireKeydown({ key: 'Escape' })
      expect(onTrigger).toHaveBeenCalledTimes(1)
      cleanup()
    })

    it('fires shortcut when focus is on the body (not an input element)', () => {
      const onTrigger = vi.fn()
      renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '?', onTrigger })]))

      // body is focused by default (afterEach resets)
      fireKeydown({ key: '?' })
      expect(onTrigger).toHaveBeenCalledTimes(1)
    })
  })

  it('removes listener on unmount', () => {
    const onTrigger = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'n', onTrigger })]))

    unmount()
    fireKeydown({ key: 'n' })

    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('only fires the first matching shortcut when multiple match', () => {
    const first = vi.fn()
    const second = vi.fn()
    renderHook(() =>
      useKeyboardShortcuts([
        makeShortcut({ key: 'n', onTrigger: first }),
        makeShortcut({ key: 'n', onTrigger: second }),
      ])
    )

    fireKeydown({ key: 'n' })

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })
})
