import type { Hotkey } from '../hotkey.types'

/** Where a key is pressed: the document, the page body, or a new field of this kind. */
export type KeyTarget = 'document' | 'body' | 'input' | 'textarea' | 'select'

interface MatchCase {
  name: string
  init: KeyboardEventInit
  target: KeyTarget
  hotkey: Hotkey
  matches: boolean
}

const modK = { key: 'k', mod: true }
const ctrlBacktick = { key: '`', ctrl: true }

/** A key pressed on a target, a hotkey, and whether the key is that hotkey. */
export const matchesHotkeyCases: MatchCase[] = [
  {
    name: 'Ctrl with the key',
    init: { key: 'k', ctrlKey: true },
    target: 'document',
    hotkey: modK,
    matches: true,
  },
  {
    name: 'Cmd with the key in capitals',
    init: { key: 'K', metaKey: true },
    target: 'document',
    hotkey: modK,
    matches: true,
  },
  {
    name: 'Cmd for a hotkey that needs Ctrl',
    init: { key: '`', metaKey: true },
    target: 'document',
    hotkey: ctrlBacktick,
    matches: false,
  },
  {
    name: 'the key alone for a hotkey that needs Ctrl',
    init: { key: '`' },
    target: 'document',
    hotkey: ctrlBacktick,
    matches: false,
  },
  {
    name: 'Ctrl for a hotkey that needs Ctrl',
    init: { key: '`', ctrlKey: true },
    target: 'document',
    hotkey: ctrlBacktick,
    matches: true,
  },
  {
    name: 'the key without the modifier',
    init: { key: 'b' },
    target: 'document',
    hotkey: { key: 'b', mod: true },
    matches: false,
  },
  {
    name: 'the key with Alt',
    init: { key: 'b', ctrlKey: true, altKey: true },
    target: 'document',
    hotkey: { key: 'b', mod: true },
    matches: false,
  },
  {
    name: 'a key without a modifier in an input',
    init: { key: '?' },
    target: 'input',
    hotkey: { key: '?' },
    matches: false,
  },
  {
    name: 'a key without a modifier in a text area',
    init: { key: '?' },
    target: 'textarea',
    hotkey: { key: '?' },
    matches: false,
  },
  {
    name: 'a key without a modifier in a select',
    init: { key: '?' },
    target: 'select',
    hotkey: { key: '?' },
    matches: false,
  },
  {
    name: 'a key with the modifier in an input',
    init: { key: 'k', ctrlKey: true },
    target: 'input',
    hotkey: modK,
    matches: true,
  },
  {
    name: 'a key without a modifier on the page',
    init: { key: '?' },
    target: 'body',
    hotkey: { key: '?' },
    matches: true,
  },
  // Cyrillic layout: the K key types a letter that is not Latin.
  {
    name: 'the place of the key on a layout that is not Latin',
    init: { key: 'л', code: 'KeyK', ctrlKey: true },
    target: 'document',
    hotkey: modK,
    matches: true,
  },
  // AZERTY: the key of the digit 1 types a symbol.
  {
    name: 'the place of a digit on a layout that types a symbol there',
    init: { key: '&', code: 'Digit1', ctrlKey: true },
    target: 'document',
    hotkey: { key: '1', mod: true },
    matches: true,
  },
  // Dvorak: the key labeled K sits where V is on a US keyboard.
  {
    name: 'the character on a Latin layout, wherever its key is',
    init: { key: 'k', code: 'KeyV', ctrlKey: true },
    target: 'document',
    hotkey: modK,
    matches: true,
  },
  // Dvorak: the key at the place of K types T, which is not the hotkey.
  {
    name: 'another character at the place of the key',
    init: { key: 't', code: 'KeyK', ctrlKey: true },
    target: 'document',
    hotkey: modK,
    matches: false,
  },
]

/** A hotkey, the name of the modifier of the platform, and the keys held, in order. */
export const hotkeyKeysCases: { hotkey: Hotkey; modifier: string; keys: string[] }[] = [
  { hotkey: { key: 'b', mod: true }, modifier: 'Ctrl', keys: ['Ctrl', 'B'] },
  { hotkey: { key: 'b', mod: true }, modifier: 'Cmd', keys: ['Cmd', 'B'] },
  { hotkey: ctrlBacktick, modifier: 'Cmd', keys: ['Ctrl', '`'] },
  { hotkey: { key: 'Escape' }, modifier: 'Cmd', keys: ['Escape'] },
  { hotkey: { key: '?' }, modifier: 'Ctrl', keys: ['?'] },
]

/** A hotkey, and the value of `aria-keyshortcuts` for it. */
export const ariaKeyShortcutsCases: { hotkey: Hotkey; shortcuts: string }[] = [
  { hotkey: modK, shortcuts: 'Control+K Meta+K' },
  { hotkey: ctrlBacktick, shortcuts: 'Control+`' },
  { hotkey: { key: 'Escape' }, shortcuts: 'Escape' },
]
