import type { PaletteCommand } from '../command.types'

function command(id: string, group: string): PaletteCommand {
  return { id, label: id, group }
}

/** The commands that each source registers, and the groups: each heading with its command ids. */
export const commandGroupCases = [
  {
    name: 'orders the groups by name and keeps the order of the commands in a group',
    sources: [
      [command('toggle', 'View'), command('console', 'Show')],
      [command('dark', 'View'), command('light', 'View')],
    ],
    groups: [
      ['Show', ['console']],
      ['View', ['toggle', 'dark', 'light']],
    ],
  },
  {
    name: 'puts the commands of one group from several sources together',
    sources: [[command('new', 'Projects')], [command('open', 'Projects')]],
    groups: [['Projects', ['new', 'open']]],
  },
  { name: 'has no group without a command', sources: [[]], groups: [] },
  { name: 'has no group without a source', sources: [], groups: [] },
]
