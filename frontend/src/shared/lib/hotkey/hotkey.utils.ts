import type { Hotkey } from './hotkey.types'

/**
 * The place on the keyboard of a letter or a digit, as in `KeyboardEvent.code`.
 * @returns `KeyK` for `k`, `Digit1` for `1`, and null for any other key.
 */
function codeOf(key: string): string | null {
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return null
}

/** Whether the focus is in a place where the user types text. */
function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.matches('input, textarea, select'))
  )
}

/**
 * Whether a key event is the hotkey.
 *
 * The key matches by the character it types, so the label on the keyboard counts on any Latin
 * layout. When it types no Latin letter or digit, as on a Cyrillic layout, it matches by its place
 * on a US keyboard instead. A hotkey without a modifier does not match while the user types in a
 * field, so it never takes a character away from the text. Alt never matches.
 */
export function isHotkeyPressed(event: KeyboardEvent, { key, mod = false, ctrl = false }: Hotkey) {
  const isHeld = ctrl ? event.ctrlKey && !event.metaKey : event.ctrlKey || event.metaKey
  if (event.altKey || isHeld !== (mod || ctrl)) return false
  if (!mod && !ctrl && isTypingTarget(event.target)) return false
  if (event.key.toLowerCase() === key.toLowerCase()) return true
  const code = codeOf(key)
  return code !== null && event.code === code && !/^[a-z0-9]$/i.test(event.key)
}

/** The name of the key of a hotkey: a letter in capitals, else the key as named. */
function keyName(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key
}

/**
 * The keys of a hotkey, in the order they are held, such as `['Ctrl', 'B']`.
 * @param modifier The name of the key that `mod` stands for: Cmd on Apple devices, else Ctrl.
 */
export function hotkeyKeys({ key, mod = false, ctrl = false }: Hotkey, modifier: string): string[] {
  if (ctrl) return ['Ctrl', keyName(key)]
  return mod ? [modifier, keyName(key)] : [keyName(key)]
}

/**
 * The text of a hotkey, such as `Ctrl+B`.
 * @param modifier The name of the key that `mod` stands for: Cmd on Apple devices, else Ctrl.
 */
export function hotkeyLabel(hotkey: Hotkey, modifier: string): string {
  return hotkeyKeys(hotkey, modifier).join('+')
}

/** The hotkey as `aria-keyshortcuts` writes it, with both keys that `mod` stands for. */
export function ariaKeyShortcuts({ key, mod = false, ctrl = false }: Hotkey): string {
  const name = keyName(key)
  if (ctrl) return `Control+${name}`
  return mod ? `Control+${name} Meta+${name}` : name
}
