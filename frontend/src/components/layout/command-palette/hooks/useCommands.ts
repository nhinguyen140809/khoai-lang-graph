import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef } from 'react'

import { matchesHotkey } from '@/hooks/useHotkey'

import type { PaletteCommand } from '../command.types'
import { useCommandRegistryStore } from '../command-registry.store'

/** What the palette shows of the commands, as text: when it changes, they register again. */
function shownKey(commands: readonly PaletteCommand[]): string {
  return JSON.stringify(
    commands.map(({ id, label, group, hotkey, run }) => [
      id,
      label,
      group,
      hotkey,
      run !== undefined,
    ]),
  )
}

/**
 * Registers commands in the command palette while the calling component is mounted, and runs each
 * one on its hotkey. A component registers the commands that act on it, so they leave with it.
 *
 * The array can be a new one on each render. The palette always runs the latest `run`, and takes
 * the commands again, icons included, when a label, a group, a hotkey or whether a command runs
 * changes.
 */
export function useCommands(commands: readonly PaletteCommand[]) {
  const source = useId()
  const setCommands = useCommandRegistryStore((state) => state.setCommands)
  const removeCommands = useCommandRegistryStore((state) => state.removeCommands)
  const latest = useRef(commands)
  const shown = shownKey(commands)

  useLayoutEffect(() => {
    latest.current = commands
  })

  useEffect(() => {
    setCommands(
      source,
      latest.current.map(({ run, ...command }) =>
        run === undefined
          ? command
          : {
              ...command,
              run: () => {
                latest.current.find(({ id }) => id === command.id)?.run?.()
              },
            },
      ),
    )
  }, [source, shown, setCommands])

  useEffect(
    () => () => {
      removeCommands(source)
    },
    [source, removeCommands],
  )

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const command = commands.find(
      ({ hotkey, run }) =>
        hotkey !== undefined && run !== undefined && matchesHotkey(event, hotkey.key, hotkey),
    )
    if (command?.run === undefined) return
    event.preventDefault()
    command.run()
  })

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
