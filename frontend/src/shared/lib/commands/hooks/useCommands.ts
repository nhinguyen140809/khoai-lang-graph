'use client'

import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef } from 'react'

import { isHotkeyPressed } from '@/shared/lib/hotkey'

import type { Command } from '../command.types'
import { shownCommandsKey } from '../command.utils'
import { useCommandRegistry } from '../commands.store'

/**
 * Registers commands while the calling component is mounted, and runs each
 * one on its hotkey. A component registers the commands that act on it, so they leave with it.
 *
 * The array can be a new one on each render. The palette always runs the latest `run`, and takes
 * the commands again, icons included, when a label, a group, a hotkey or whether a command runs
 * changes.
 */
export function useCommands(commands: readonly Command[]) {
  const source = useId()
  const setCommands = useCommandRegistry((state) => state.setCommands)
  const removeCommands = useCommandRegistry((state) => state.removeCommands)
  const latest = useRef(commands)
  const shown = shownCommandsKey(commands)

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
              run: (args) => {
                latest.current.find(({ id }) => id === command.id)?.run?.(args)
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
        hotkey !== undefined && run !== undefined && isHotkeyPressed(event, hotkey),
    )
    if (command?.run === undefined) return
    event.preventDefault()
    command.run({})
  })

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
