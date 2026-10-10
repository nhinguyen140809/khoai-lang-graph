import { useEffect, useEffectEvent } from 'react'

interface HotkeyOptions {
  /** Requires Ctrl, or Cmd on macOS. Without it, the key only matches with neither held. */
  mod?: boolean
  /** Listens only while true. */
  enabled?: boolean
}

/** Whether a key event is `key` with the modifier given in `options`, and no Alt. */
export function matchesHotkey(event: KeyboardEvent, key: string, { mod = false }: HotkeyOptions) {
  const modPressed = event.ctrlKey || event.metaKey
  return event.key.toLowerCase() === key.toLowerCase() && modPressed === mod && !event.altKey
}

/**
 * Calls `handler` when `key` is pressed anywhere on the page, inputs included, and prevents the
 * browser default, since Ctrl+K and Ctrl+B are browser shortcuts too.
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
