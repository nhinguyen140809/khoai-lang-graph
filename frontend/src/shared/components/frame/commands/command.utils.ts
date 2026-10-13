import type { CommandHotkey, PaletteCommand } from './command.types'

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

/** The name of the key of a hotkey: a letter in capitals, else the key as named. */
function keyName(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key
}

/**
 * The keys of a hotkey, in the order they are held, such as `['Ctrl', 'B']`.
 * @param modifier The name of the key that `mod` stands for: Cmd on Apple devices, else Ctrl.
 */
export function hotkeyKeys(
  { key, mod = false, ctrl = false }: CommandHotkey,
  modifier: string,
): string[] {
  if (ctrl) return ['Ctrl', keyName(key)]
  return mod ? [modifier, keyName(key)] : [keyName(key)]
}

/**
 * The text of a hotkey, such as `Ctrl+B`.
 * @param modifier The name of the key that `mod` stands for: Cmd on Apple devices, else Ctrl.
 */
export function hotkeyLabel(hotkey: CommandHotkey, modifier: string): string {
  return hotkeyKeys(hotkey, modifier).join('+')
}

/** The hotkey as `aria-keyshortcuts` writes it, with both keys that `mod` stands for. */
export function ariaKeyShortcuts({ key, mod = false, ctrl = false }: CommandHotkey): string {
  const name = keyName(key)
  if (ctrl) return `Control+${name}`
  return mod ? `Control+${name} Meta+${name}` : name
}
