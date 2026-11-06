import { fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ariaKeyShortcuts,
  hotkeyKeys,
  hotkeyLabel,
  isHotkeyPressed,
  isSubmitKey,
} from '../hotkey.utils'
import {
  ariaKeyShortcutsCases,
  hotkeyKeysCases,
  type KeyTarget,
  matchesHotkeyCases,
} from './hotkey.utils.data'

function targetOf(target: KeyTarget): Document | Element {
  if (target === 'document') return document
  if (target === 'body') return document.body
  return document.body.appendChild(document.createElement(target))
}

/** The keydown event of a key pressed on `target`, as the document receives it. */
function press(init: KeyboardEventInit, target: KeyTarget): KeyboardEvent {
  const events: KeyboardEvent[] = []
  const listen = (event: KeyboardEvent) => {
    events.push(event)
  }
  document.addEventListener('keydown', listen)
  fireEvent.keyDown(targetOf(target), init)
  document.removeEventListener('keydown', listen)
  const [event] = events
  if (event === undefined) throw new Error('The document received no keydown event.')
  return event
}

describe('isSubmitKey', () => {
  it.each([
    { name: 'Enter', key: 'Enter', shiftKey: false, isComposing: false, sends: true },
    { name: 'Shift+Enter', key: 'Enter', shiftKey: true, isComposing: false, sends: false },
    {
      name: 'Enter in a composition',
      key: 'Enter',
      shiftKey: false,
      isComposing: true,
      sends: false,
    },
    { name: 'another key', key: 'a', shiftKey: false, isComposing: false, sends: false },
  ])('sends on $name: $sends', ({ key, shiftKey, isComposing, sends }) => {
    expect(isSubmitKey({ key, shiftKey, isComposing })).toBe(sends)
  })
})

describe('isHotkeyPressed', () => {
  it.each(matchesHotkeyCases)('$name: $matches', ({ init, target, hotkey, matches }) => {
    expect(isHotkeyPressed(press(init, target), hotkey)).toBe(matches)
  })
})

describe('hotkeyKeys and hotkeyLabel', () => {
  it.each(hotkeyKeysCases)('name $keys with $modifier', ({ hotkey, modifier, keys }) => {
    expect(hotkeyKeys(hotkey, modifier)).toEqual(keys)
    expect(hotkeyLabel(hotkey, modifier)).toBe(keys.join('+'))
  })
})

describe('ariaKeyShortcuts', () => {
  it.each(ariaKeyShortcutsCases)('writes $shortcuts', ({ hotkey, shortcuts }) => {
    expect(ariaKeyShortcuts(hotkey)).toBe(shortcuts)
  })
})
