import { useEffect, useEffectEvent } from 'react'

interface HotkeyOptions {
  /**
   * Requires the modifier key of the platform: Ctrl on Windows and Linux, Cmd on macOS. Without
   * it, the key matches only when neither is held.
   */
  mod?: boolean
  /** Listens only while true. */
  enabled?: boolean
}

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
 * on a US keyboard instead. A hotkey without `mod` does not match while the user types in a field,
 * so it never takes a character away from the text. Alt never matches.
 *
 * @param key A character, such as `k` or `?`, or a key name, such as `Escape`.
 */
export function matchesHotkey(event: KeyboardEvent, key: string, { mod = false }: HotkeyOptions) {
  if (event.altKey || (event.ctrlKey || event.metaKey) !== mod) return false
  if (!mod && isTypingTarget(event.target)) return false
  if (event.key.toLowerCase() === key.toLowerCase()) return true
  const code = codeOf(key)
  return code !== null && event.code === code && !/^[a-z0-9]$/i.test(event.key)
}

/**
 * Calls `handler` when the hotkey is pressed anywhere on the page, and prevents the default of the
 * browser, which has its own Ctrl+K, Ctrl+B and Ctrl+O.
 *
 * @param key A character, such as `k`, or a key name, such as `Escape`.
 * @param handler Always the latest one: the listener is not added again when it changes.
 */
export function useHotkey(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { mod = false, enabled = true }: HotkeyOptions = {},
) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!matchesHotkey(event, key, { mod })) return
    event.preventDefault()
    handler(event)
  })

  useEffect(() => {
    if (!enabled) return
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled])
}
