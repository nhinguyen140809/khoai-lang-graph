'use client'

import { useState } from 'react'

/**
 * Keys that are open, such as the steps of a stepper: those given at first, then each key that
 * joins them; `toggle` opens or closes one. A key the user closed stays closed while it stays in
 * the keys given; a key that joins is added while rendering from the new keys, never in an effect,
 * so the set is never one render behind.
 */
export function useOpenKeys(keysToOpen: readonly string[]): {
  isOpen: (key: string) => boolean
  toggle: (key: string) => void
} {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(keysToOpen))
  const [knownKeys, setKnownKeys] = useState<readonly string[]>(keysToOpen)

  const joined = keysToOpen.filter((key) => !knownKeys.includes(key))
  const hasSameKeys =
    keysToOpen.length === knownKeys.length &&
    keysToOpen.every((key, index) => key === knownKeys[index])
  if (!hasSameKeys) {
    if (joined.length > 0) setOpen((current) => new Set([...current, ...joined]))
    setKnownKeys(keysToOpen)
  }

  return {
    isOpen: (key) => open.has(key),
    toggle: (key) => {
      setOpen((current) => {
        const next = new Set(current)
        if (current.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    },
  }
}
