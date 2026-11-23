import type { Command } from './command.types'

/** What the palette shows of the commands, as text: when it changes, they register again. */
export function shownCommandsKey(commands: readonly Command[]): string {
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
 * The first command of this id that runs, from the commands that components registered; none for
 * an id that no mounted component registers, or that only informs.
 */
export function runnableCommand(
  sources: Iterable<readonly Command[]>,
  id: string,
): (Command & { run: NonNullable<Command['run']> }) | undefined {
  for (const commands of sources) {
    const found = commands.find((command) => command.id === id && command.run !== undefined)
    if (found?.run !== undefined) return { ...found, run: found.run }
  }
  return undefined
}
