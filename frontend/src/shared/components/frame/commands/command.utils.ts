import type { PaletteCommand } from './command.types'

interface GroupOfCommands {
  heading: string
  commands: PaletteCommand[]
}

/**
 * The commands by group. The groups are in alphabetical order, so that the list does not depend on
 * the order in which the components that register them mount; a group keeps the order of its
 * commands.
 */
export function commandGroups(sources: Iterable<readonly PaletteCommand[]>): GroupOfCommands[] {
  const groups = new Map<string, PaletteCommand[]>()
  for (const commands of sources) {
    for (const command of commands) {
      const group = groups.get(command.group)
      if (group === undefined) groups.set(command.group, [command])
      else group.push(command)
    }
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([heading, commands]) => ({ heading, commands }))
}
