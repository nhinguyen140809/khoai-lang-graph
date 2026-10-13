import { fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ariaKeyShortcuts, hotkeyKeys, hotkeyLabel, matchesHotkey } from '../hotkey.utils'

/** The keydown event of a key pressed on `target`, as the document receives it. */
function press(init: KeyboardEventInit, target: Document | Element = document): KeyboardEvent {
  const events: KeyboardEvent[] = []
  const listen = (event: KeyboardEvent) => {
    events.push(event)
  }
  document.addEventListener('keydown', listen)
  fireEvent.keyDown(target, init)
  document.removeEventListener('keydown', listen)
  const [event] = events
  if (event === undefined) throw new Error('The document received no keydown event.')
  return event
}

describe('matchesHotkey', () => {
  it('matches Ctrl or Cmd with the key', () => {
    const hotkey = { key: 'k', mod: true }

    expect(matchesHotkey(press({ key: 'k', ctrlKey: true }), hotkey)).toBe(true)
    expect(matchesHotkey(press({ key: 'K', metaKey: true }), hotkey)).toBe(true)
  })

  it('takes Ctrl only, for a hotkey that needs Ctrl on every platform', () => {
    const hotkey = { key: '`', ctrl: true }

    expect(matchesHotkey(press({ key: '`', metaKey: true }), hotkey)).toBe(false)
    expect(matchesHotkey(press({ key: '`' }), hotkey)).toBe(false)
    expect(matchesHotkey(press({ key: '`', ctrlKey: true }), hotkey)).toBe(true)
  })

  it('ignores the key without the modifier, and with Alt', () => {
    const hotkey = { key: 'b', mod: true }

    expect(matchesHotkey(press({ key: 'b' }), hotkey)).toBe(false)
    expect(matchesHotkey(press({ key: 'b', ctrlKey: true, altKey: true }), hotkey)).toBe(false)
  })

  it('leaves a key without the modifier to a field the user types in', () => {
    const input = document.createElement('input')
    const textarea = document.createElement('textarea')
    document.body.append(input, textarea)

    expect(matchesHotkey(press({ key: '?' }, input), { key: '?' })).toBe(false)
    expect(matchesHotkey(press({ key: '?' }, textarea), { key: '?' })).toBe(false)
    expect(matchesHotkey(press({ key: 'k', ctrlKey: true }, input), { key: 'k', mod: true })).toBe(
      true,
    )
    expect(matchesHotkey(press({ key: '?' }, document.body), { key: '?' })).toBe(true)
    input.remove()
    textarea.remove()
  })

  it('matches by the character on a Latin layout, else by the place of the key', () => {
    const hotkey = { key: 'k', mod: true }

    // Cyrillic layout: the K key types a letter that is not Latin.
    expect(matchesHotkey(press({ key: 'л', code: 'KeyK', ctrlKey: true }), hotkey)).toBe(true)
    // Dvorak: the key labeled K sits where V is on a US keyboard.
    expect(matchesHotkey(press({ key: 'k', code: 'KeyV', ctrlKey: true }), hotkey)).toBe(true)
    // Dvorak: the key at the place of K types T, which is not the hotkey.
    expect(matchesHotkey(press({ key: 't', code: 'KeyK', ctrlKey: true }), hotkey)).toBe(false)
  })
})

describe('hotkeyLabel', () => {
  it('names the modifier of the platform, and a letter in capitals', () => {
    expect(hotkeyLabel({ key: 'b', mod: true }, 'Ctrl')).toBe('Ctrl+B')
    expect(hotkeyLabel({ key: 'b', mod: true }, 'Cmd')).toBe('Cmd+B')
    expect(hotkeyLabel({ key: 'Escape' }, 'Cmd')).toBe('Escape')
  })

  it('names Ctrl on every platform for a hotkey that needs it', () => {
    expect(hotkeyLabel({ key: '`', ctrl: true }, 'Cmd')).toBe('Ctrl+`')
  })
})

describe('hotkeyKeys', () => {
  it('lists the keys held, the modifier first', () => {
    expect(hotkeyKeys({ key: 'k', mod: true }, 'Cmd')).toEqual(['Cmd', 'K'])
    expect(hotkeyKeys({ key: '`', ctrl: true }, 'Cmd')).toEqual(['Ctrl', '`'])
  })
})

describe('ariaKeyShortcuts', () => {
  it('names both keys that the modifier stands for', () => {
    expect(ariaKeyShortcuts({ key: 'k', mod: true })).toBe('Control+K Meta+K')
    expect(ariaKeyShortcuts({ key: '`', ctrl: true })).toBe('Control+`')
  })
})
