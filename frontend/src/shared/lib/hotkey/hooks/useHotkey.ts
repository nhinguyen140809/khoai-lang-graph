import { useEffect } from 'react'

import type { Hotkey } from '../hotkey.types'
import { isHotkeyPressed } from '../hotkey.utils'

/**
 * Runs `run` each time the user presses the hotkey, anywhere on the page, and keeps the key
 * from doing what the page would do otherwise. The listener leaves with the part that asked.
 */
export function useHotkey(hotkey: Hotkey, run: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isHotkeyPressed(event, hotkey)) return
      event.preventDefault()
      run()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [hotkey, run])
}
