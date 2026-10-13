import { useSyncExternalStore } from 'react'

type ModifierKeyName = 'Cmd' | 'Ctrl'

// The platform does not change while the page runs.
const subscribe = () => () => undefined
const inBrowser = (): ModifierKeyName =>
  /Mac|iPhone|iPad/.test(navigator.userAgent) ? 'Cmd' : 'Ctrl'
const onServer = (): ModifierKeyName => 'Ctrl'

/**
 * The name of the modifier key of the shortcuts, for the labels that show them: Cmd on Apple
 * devices, Ctrl elsewhere. The server does not know the platform, so the first render says Ctrl.
 */
export function useModifierKeyName(): ModifierKeyName {
  return useSyncExternalStore(subscribe, inBrowser, onServer)
}
