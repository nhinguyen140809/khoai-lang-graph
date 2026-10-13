import type { CommandHotkey, PaletteCommand } from './command.types'

interface PaletteGroup {
  heading: string
  commands: PaletteCommand[]
}

/**
 * The commands by group. The groups are in alphabetical order, so that the list does not depend on
 * the order in which the components that register them mount; a group keeps the order of its
 * commands.
 */
export function commandGroups(sources: Iterable<readonly PaletteCommand[]>): PaletteGroup[] {
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

/**
 * The text of a hotkey, such as `Ctrl+B`.
 * @param modifier The name of the key that `mod` stands for: Cmd on Apple devices, else Ctrl.
 */
export function hotkeyLabel(
  { key, mod = false, ctrl = false }: CommandHotkey,
  modifier: string,
): string {
  const name = key.length === 1 ? key.toUpperCase() : key
  if (ctrl) return `Ctrl+${name}`
  return mod ? `${modifier}+${name}` : name
}
