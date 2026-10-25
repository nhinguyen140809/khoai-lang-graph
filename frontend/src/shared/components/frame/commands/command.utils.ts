import { defaultFilter } from 'cmdk'

import { hasText } from '@/shared/lib/guards'
import { foldText } from '@/shared/lib/text'

import type { PaletteCommand, PaletteCommandGroup } from './command.types'

/**
 * The commands by group. The groups are in alphabetical order, so that the list does not depend on
 * the order in which the components that register them mount; a group keeps the order of its
 * commands.
 */
export function commandGroups(sources: Iterable<readonly PaletteCommand[]>): PaletteCommandGroup[] {
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

/** The text that the search of the palette matches: the group, the label, and the id, which keeps two equal labels apart. */
export function commandSearchText({ group, label, id }: PaletteCommand): string {
  return `${group} ${label} ${id}`
}

/**
 * How well a command matches a search, with the score of cmdk, but whatever the case and the
 * accents: "nguyen" finds "Nguyễn". Zero means no match.
 */
export function commandMatchScore(value: string, search: string): number {
  return defaultFilter(foldText(value), foldText(search))
}

/**
 * The groups while the palette searches: first the group of the command that matches best, with
 * the score of the search of the palette, so that the best match shows at the top of the list.
 * Groups that match as well keep their order, and without a search the order stays. The palette
 * orders its groups itself: the search of cmdk orders the commands of a group, not the groups.
 */
export function groupsBySearch(
  groups: PaletteCommandGroup[],
  search: string,
): PaletteCommandGroup[] {
  if (!hasText(search)) return groups
  const best = ({ commands }: PaletteCommandGroup) =>
    Math.max(0, ...commands.map((command) => commandMatchScore(commandSearchText(command), search)))
  return groups
    .map((group) => ({ group, score: best(group) }))
    .toSorted((a, b) => b.score - a.score)
    .map(({ group }) => group)
}

/** What the palette shows of the commands, as text: when it changes, they register again. */
export function shownCommandsKey(commands: readonly PaletteCommand[]): string {
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
